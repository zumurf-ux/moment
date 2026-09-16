package com.thedesignuncle.jamsi.issue

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.json.Json
import com.thedesignuncle.jamsi.data.local.IssueDao
import com.thedesignuncle.jamsi.data.local.AppConfigEntity
import com.thedesignuncle.jamsi.data.local.AvailableDateEntity
import com.thedesignuncle.jamsi.data.local.IssueEntity
import com.thedesignuncle.jamsi.data.network.IssueApi
import com.thedesignuncle.jamsi.data.network.IssueDto
import com.thedesignuncle.jamsi.data.network.AppConfigDto
import com.thedesignuncle.jamsi.model.AppConfig
import com.thedesignuncle.jamsi.model.Issue
import com.thedesignuncle.jamsi.model.IssueItem
import com.thedesignuncle.jamsi.model.IssueType
import com.thedesignuncle.jamsi.model.MarketSnapshot
import java.time.LocalDate

interface IssueRepository {
    fun observeSelected(): Flow<Issue?>
    fun observeConfig(): Flow<AppConfig>
    fun observeMarkets(): Flow<MarketSnapshot>
    suspend fun refreshLatest(type: IssueType = IssueType.DAILY)
    suspend fun refreshConfig()
    suspend fun refreshMarkets()
    suspend fun select(type: IssueType, date: String)
    suspend fun availableDates(type: IssueType): Set<String>
}

class OfflineFirstIssueRepository(
    private val api: IssueApi,
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
        runCatching { api.latest(key) }
            .onSuccess { dto -> cache(dto); selected.value = dto.toModel() }
            .getOrElse { error ->
                selected.value = dao.latest(key)?.decode()
                if (selected.value == null) throw error
            }
    }

    override suspend fun select(type: IssueType, date: String) {
        val key = type.name.lowercase()
        runCatching { api.byDate(key, date) }
            .onSuccess { dto -> cache(dto); selected.value = dto.toModel() }
            .getOrElse { error ->
                selected.value = dao.byDate(key, date)?.decode()
                if (selected.value == null) throw error
            }
    }

    override suspend fun availableDates(type: IssueType): Set<String> {
        val key = type.name.lowercase()
        val today = LocalDate.now()
        return runCatching {
            val dates = api.calendar(key, today.minusMonths(12).toString(), today.plusDays(1).toString()).availableDates
            dao.clearAvailableDates(key)
            dao.upsertAvailableDates(dates.map { AvailableDateEntity(key, it, System.currentTimeMillis()) })
            dates.toSet()
        }.getOrElse { (dao.cachedAvailableDates(key) + dao.availableDates(key)).toSet() }
    }

    override suspend fun refreshConfig() {
        runCatching { api.appConfig(version = com.thedesignuncle.jamsi.BuildConfig.VERSION_NAME) }
            .onSuccess { dto ->
                dao.upsertAppConfig(AppConfigEntity("android", json.encodeToString(AppConfigDto.serializer(), dto), System.currentTimeMillis()))
                config.value = dto.toModel()
            }
            .getOrElse { error ->
                val cached = dao.appConfig()?.let { json.decodeFromString(AppConfigDto.serializer(), it.payloadJson) }
                if (cached != null) config.value = cached.toModel() else throw error
            }
    }

    override suspend fun refreshMarkets() = Unit

    private suspend fun cache(dto: IssueDto) = dao.upsert(IssueEntity(dto.id, dto.type, dto.publishDate, dto.version, json.encodeToString(IssueDto.serializer(), dto), System.currentTimeMillis()))
    private fun IssueEntity.decode(): Issue = json.decodeFromString(IssueDto.serializer(), payloadJson).toModel()
}

private fun IssueDto.toModel() = Issue(
    id, IssueType.valueOf(type.uppercase()), publishDate, displayDate, version, headline,
    items.map { IssueItem(it.order, it.category, it.title, it.summary, it.isHot, it.sourceName, it.sourceUrl, it.factDate) }, closingText,
    sourceCount, reviewedAt ?: "검수 정보 없음", correctionNote,
)

private fun AppConfigDto.toModel() = AppConfig(
    adsEnabled = ads.enabled,
    interstitialMinSeconds = ads.minSeconds,
    interstitialMaxPerSession = ads.maxPerSession,
    interstitialPlacement = ads.placement,
    maintenanceEnabled = maintenance.enabled,
    maintenanceMessage = maintenance.message,
    minimumVersion = minimumVersion,
)
