package com.thedesignuncle.jamsi.issue

import android.util.Log
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.Json
import com.thedesignuncle.jamsi.data.local.AppConfigEntity
import com.thedesignuncle.jamsi.data.local.AvailableDateEntity
import com.thedesignuncle.jamsi.data.local.IssueDao
import com.thedesignuncle.jamsi.data.local.IssueEntity
import com.thedesignuncle.jamsi.data.network.AdsConfigDto
import com.thedesignuncle.jamsi.data.network.AppConfigDto
import com.thedesignuncle.jamsi.data.network.IssueDto
import com.thedesignuncle.jamsi.data.network.IssueItemDto
import com.thedesignuncle.jamsi.data.network.MaintenanceConfigDto
import com.thedesignuncle.jamsi.model.AppConfig
import com.thedesignuncle.jamsi.model.Issue
import com.thedesignuncle.jamsi.model.IssueItem
import com.thedesignuncle.jamsi.model.IssueType
import com.thedesignuncle.jamsi.model.MarketQuote
import com.thedesignuncle.jamsi.model.MarketSnapshot
import java.time.LocalDate
import java.time.Instant
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

class FirebaseIssueRepository(
    private val firestore: FirebaseFirestore,
    private val dao: IssueDao,
    private val json: Json,
) : IssueRepository {
    private val selected = MutableStateFlow<Issue?>(null)
    private val config = MutableStateFlow(AppConfig())
    private val markets = MutableStateFlow(MarketSnapshot())

    override fun observeSelected(): Flow<Issue?> = selected
    override fun observeConfig(): Flow<AppConfig> = config
    override fun observeMarkets(): Flow<MarketSnapshot> = markets

    override suspend fun refreshLatest(type: IssueType) {
        val key = type.name.lowercase()
        runCatching {
            firestore.collection("editions")
                .whereEqualTo("type", key)
                .whereEqualTo("status", "PUBLISHED")
                .get().await().documents
                .filter { it.isVisibleNow() }
                .map { it.toIssue() }
                .maxWithOrNull(compareBy<Issue> { it.publishDate }.thenBy { it.version })
                ?: error("공개된 발행본이 없습니다.")
        }.onSuccess { issue -> cache(issue); selected.value = issue }
            .getOrElse { error ->
                Log.e("JamsiFirebase", "최신 발행본 조회 실패", error)
                selected.value = dao.latest(key)?.decode() ?: throw error
            }
    }

    override suspend fun select(type: IssueType, date: String) {
        val key = type.name.lowercase()
        runCatching {
            firestore.collection("editions")
                .whereEqualTo("type", key)
                .whereEqualTo("publishDate", date)
                .whereEqualTo("status", "PUBLISHED")
                .get().await().documents
                .filter { it.isVisibleNow() }
                .map { it.toIssue() }
                .maxByOrNull { it.version }
                ?: error("선택한 발행본이 없습니다.")
        }.onSuccess { issue -> cache(issue); selected.value = issue }
            .getOrElse { error ->
                Log.e("JamsiFirebase", "선택 발행본 조회 실패", error)
                selected.value = dao.byDate(key, date)?.decode() ?: throw error
            }
    }

    override suspend fun availableDates(type: IssueType): Set<String> {
        val key = type.name.lowercase()
        return runCatching {
            val dates = firestore.collection("editions")
                .whereEqualTo("type", key)
                .whereEqualTo("status", "PUBLISHED")
                .get().await().documents
                .filter { it.isVisibleNow() }
                .mapNotNull { it.getString("publishDate") }
                .distinct().sortedDescending()
            dao.clearAvailableDates(key)
            dao.upsertAvailableDates(dates.map { AvailableDateEntity(key, it, System.currentTimeMillis()) })
            dates.toSet()
        }.getOrElse { (dao.cachedAvailableDates(key) + dao.availableDates(key)).toSet() }
    }

    override suspend fun refreshConfig() {
        runCatching {
            val data = firestore.collection("appConfig").document("android").get().await().data.orEmpty()
            AppConfig(
                adsEnabled = data["adsEnabled"] as? Boolean ?: false,
                maintenanceEnabled = data["maintenanceEnabled"] as? Boolean ?: false,
                maintenanceMessage = data["maintenanceMessage"] as? String,
                minimumVersion = data["minimumVersion"] as? String ?: "1.0.0",
            )
        }.onSuccess { value ->
            config.value = value
            val dto = AppConfigDto(
                AdsConfigDto(value.adsEnabled, value.interstitialMinSeconds, value.interstitialMaxPerSession, value.interstitialPlacement),
                MaintenanceConfigDto(value.maintenanceEnabled, value.maintenanceMessage),
                value.minimumVersion,
            )
            dao.upsertAppConfig(AppConfigEntity("android", json.encodeToString(AppConfigDto.serializer(), dto), System.currentTimeMillis()))
        }.getOrElse { error ->
            val cached = dao.appConfig()?.let { json.decodeFromString(AppConfigDto.serializer(), it.payloadJson) }
            if (cached != null) config.value = AppConfig(
                cached.ads.enabled, cached.ads.minSeconds, cached.ads.maxPerSession, cached.ads.placement,
                cached.maintenance.enabled, cached.maintenance.message, cached.minimumVersion,
            ) else throw error
        }
    }

    override suspend fun refreshMarkets() {
        runCatching {
            val snapshot = firestore.collection("appConfig").document("markets").get().await()
            @Suppress("UNCHECKED_CAST")
            val rawQuotes = snapshot.get("quotes") as? List<Map<String, Any?>> ?: emptyList()
            MarketSnapshot(
                quotes = rawQuotes.mapNotNull { quote ->
                    val symbol = quote["symbol"] as? String ?: return@mapNotNull null
                    MarketQuote(
                        symbol = symbol,
                        name = quote["name"] as? String ?: symbol,
                        value = (quote["value"] as? Number)?.toDouble() ?: 0.0,
                        change = (quote["change"] as? Number)?.toDouble() ?: 0.0,
                        changePercent = (quote["changePercent"] as? Number)?.toDouble() ?: 0.0,
                        currency = quote["currency"] as? String ?: "",
                    )
                },
                updatedAt = snapshot.getString("updatedAt").orEmpty(),
                basisDate = snapshot.getString("basisDate").orEmpty(),
                delayed = snapshot.getBoolean("delayed") ?: true,
            )
        }.onSuccess { markets.value = it }
            .onFailure { error -> Log.w("JamsiFirebase", "지수 시세 조회 실패", error) }
    }

    private suspend fun cache(issue: Issue) {
        val dto = issue.toDto()
        dao.upsert(IssueEntity(issue.id, issue.type.name.lowercase(), issue.publishDate, issue.version, json.encodeToString(IssueDto.serializer(), dto), System.currentTimeMillis()))
    }

    private fun IssueEntity.decode(): Issue {
        val dto = json.decodeFromString(IssueDto.serializer(), payloadJson)
        return dto.toIssueModel()
    }
}

private fun DocumentSnapshot.isVisibleNow(now: Instant = Instant.now()): Boolean {
    val visibleAt = when (val raw = get("visibleAt")) {
        is com.google.firebase.Timestamp -> raw.toDate().toInstant()
        is String -> runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        else -> null
    }
    return visibleAt == null || !visibleAt.isAfter(now)
}

private fun DocumentSnapshot.toIssue(): Issue {
    val publishDate = getString("publishDate") ?: error("publishDate가 없습니다.")
    @Suppress("UNCHECKED_CAST")
    val rawItems = get("items") as? List<Map<String, Any?>> ?: emptyList()
    return Issue(
        id = id,
        type = IssueType.valueOf((getString("type") ?: "daily").uppercase()),
        publishDate = publishDate,
        displayDate = runCatching { LocalDate.parse(publishDate).format(DateTimeFormatter.ofPattern("yyyy. MM. dd EEEE", Locale.KOREAN)) }.getOrDefault(publishDate),
        version = (getLong("version") ?: 1L).toInt(),
        headline = getString("headline") ?: "오늘 반드시 알아야 할 핵심 팩트",
        items = rawItems.mapIndexed { index, item ->
            IssueItem(
                order = (item["order"] as? Number)?.toInt() ?: index + 1,
                category = item["category"] as? String ?: "일반",
                title = item["title"] as? String ?: "",
                summary = item["summary"] as? String ?: "",
                isHot = item["isHot"] as? Boolean ?: false,
                sourceName = item["sourceName"] as? String ?: "",
                sourceUrl = item["sourceUrl"] as? String ?: "",
                factDate = item["factDate"] as? String ?: "",
            )
        },
        closingText = getString("closingText") ?: "",
        sourceCount = (getLong("sourceCount") ?: 0L).toInt(),
        reviewedAt = getString("reviewedAt") ?: "검수 정보 없음",
        correctionNote = getString("correctionNote"),
    )
}

private fun Issue.toDto() = IssueDto(
    id, type.name.lowercase(), publishDate, displayDate, version, headline,
    items.map { IssueItemDto(it.order, it.category, it.title, it.summary, it.isHot, it.sourceName, it.sourceUrl, it.factDate) },
    closingText, sourceCount, reviewedAt, correctionNote,
)

private fun IssueDto.toIssueModel() = Issue(
    id, IssueType.valueOf(type.uppercase()), publishDate, displayDate, version, headline,
    items.map { IssueItem(it.order, it.category, it.title, it.summary, it.isHot, it.sourceName, it.sourceUrl, it.factDate) },
    closingText, sourceCount, reviewedAt ?: "검수 정보 없음", correctionNote,
)
