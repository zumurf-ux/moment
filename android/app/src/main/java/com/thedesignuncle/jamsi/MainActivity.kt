package com.thedesignuncle.jamsi

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton

import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.thedesignuncle.jamsi.issue.IssueUiState
import com.thedesignuncle.jamsi.issue.IssueViewModel
import com.thedesignuncle.jamsi.issue.IssueViewModelFactory
import com.thedesignuncle.jamsi.model.IssueType
import com.thedesignuncle.jamsi.model.MarketQuote
import com.thedesignuncle.jamsi.model.MarketSnapshot
import java.text.NumberFormat
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val Ink = Color(0xFF15191D)
private val InkBlue = Color(0xFF153047)
private val MutedInk = Color(0xFF606970)
private val Paper = Color(0xFFFFFFFF)
private val PaperDeep = Color(0xFFEDF0F2)
private val PaperFiber = Color(0xFF76818A)
private val PrintRule = Color(0xFF59636A)
private val Accent = Color(0xFFA75638)

private val NewspaperColors = lightColorScheme(
    primary = InkBlue,
    onPrimary = Paper,
    primaryContainer = Color(0xFFD7E2E8),
    onPrimaryContainer = InkBlue,
    secondary = Accent,
    onSecondary = Color.White,
    background = PaperDeep,
    onBackground = Ink,
    surface = Paper,
    onSurface = Ink,
    outline = PrintRule,
)

private val NewspaperTypography = Typography(
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Black),
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold),
)

private val PrintShadow = Shadow(
    color = Color(0x24153047),
    offset = Offset(0.35f, 0.35f),
    blurRadius = 0.25f,
)

class MainActivity : ComponentActivity() {
    private lateinit var consentInformation: ConsentInformation
    private var adsReady by mutableStateOf(false)
    private var privacyOptionsRequired by mutableStateOf(false)
    private var interstitialEligible = false
    private var naturalBreakReached = false
    private var interstitialShown = false
    private var interstitialAd: InterstitialAd? = null
    private var adsInitialized = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        if (BuildConfig.ADS_ENABLED) {
            initializeAdsWithConsent()
            lifecycleScope.launch {
                delay(30_000)
                interstitialEligible = true
                tryShowInterstitial()
            }
        }
        setContent {
            MaterialTheme(colorScheme = NewspaperColors, typography = NewspaperTypography) {
                val container = (application as JamsiApplication).container
                val viewModel: IssueViewModel = viewModel(factory = IssueViewModelFactory(container.repository))
                val state by viewModel.state.collectAsStateWithLifecycle()
                val showAds = adsReady && (BuildConfig.DEBUG || state.appConfig.adsEnabled)
                Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) {
                        IssueRoute(
                            state = state,
                            onRetry = viewModel::refresh,
                            onOpenDates = { viewModel.setDateSheet(true) },
                            onDateSheet = viewModel::setDateSheet,
                            onType = viewModel::selectType,
                            onDate = viewModel::selectDate,
                            adsEnabled = showAds,
                            privacyOptionsRequired = privacyOptionsRequired,
                            onNaturalBreak = {
                                naturalBreakReached = true
                                tryShowInterstitial()
                            },
                            onPrivacyOptions = ::showPrivacyOptions,
                        )
                    }
                    if (showAds) JamsiBannerAd()
                }
            }
        }
    }

    private fun initializeAdsWithConsent() {
        consentInformation = UserMessagingPlatform.getConsentInformation(this)
        val params = ConsentRequestParameters.Builder().build()
        consentInformation.requestConsentInfoUpdate(this, params, {
            privacyOptionsRequired = consentInformation.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(this) {
                if (consentInformation.canRequestAds()) initializeMobileAds()
            }
        }, { error ->
            Log.w("JamsiAds", "동의 정보 갱신 실패: ${error.message}")
            if (consentInformation.canRequestAds()) initializeMobileAds()
        })
        if (consentInformation.canRequestAds()) initializeMobileAds()
    }

    private fun initializeMobileAds() {
        if (adsInitialized) return
        adsInitialized = true
        MobileAds.initialize(this) {
            adsReady = true
            loadInterstitial()
        }
    }

    private fun loadInterstitial() {
        InterstitialAd.load(this, BuildConfig.ADMOB_INTERSTITIAL_ID, AdRequest.Builder().build(), object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) {
                interstitialAd = ad
                ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() { interstitialAd = null }
                    override fun onAdFailedToShowFullScreenContent(error: com.google.android.gms.ads.AdError) { interstitialAd = null }
                }
                tryShowInterstitial()
            }
            override fun onAdFailedToLoad(error: com.google.android.gms.ads.LoadAdError) {
                interstitialAd = null
                Log.w("JamsiAds", "전면 광고 로드 실패: ${error.message}")
            }
        })
    }

    private fun tryShowInterstitial() {
        if (!interstitialEligible || !naturalBreakReached || interstitialShown || isFinishing) return
        val ad = interstitialAd ?: return
        interstitialShown = true
        ad.show(this)
    }

    private fun showPrivacyOptions() {
        UserMessagingPlatform.showPrivacyOptionsForm(this) { error ->
            if (error != null) Log.w("JamsiAds", "개인정보 선택 화면 오류: ${error.message}")
        }
    }
}

@Composable
private fun JamsiBannerAd() {
    val context = LocalContext.current
    val widthDp = LocalConfiguration.current.screenWidthDp
    val adView = remember {
        AdView(context).apply {
            adUnitId = BuildConfig.ADMOB_BANNER_ID
            setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(context, widthDp))
            loadAd(AdRequest.Builder().build())
        }
    }
    AndroidView(factory = { adView }, modifier = Modifier.fillMaxWidth())
    DisposableEffect(adView) { onDispose { adView.destroy() } }
}

@Composable
private fun PaperTexture(modifier: Modifier = Modifier, baseColor: Color = Paper) {
    Canvas(modifier = modifier) {
        drawRect(baseColor)
        repeat(420) { index ->
            val x = (((index * 83) % 997) / 997f) * size.width
            val y = (((index * 137 + 29) % 991) / 991f) * size.height
            val alpha = 0.018f + (index % 4) * 0.006f
            drawCircle(
                color = PaperFiber.copy(alpha = alpha),
                radius = if (index % 7 == 0) 0.9f else 0.5f,
                center = Offset(x, y),
            )
        }
        repeat(72) { index ->
            val y = (((index * 47 + 17) % 503) / 503f) * size.height
            val start = (((index * 61) % 269) / 269f) * size.width
            val length = size.width * (0.08f + (index % 5) * 0.025f)
            drawLine(
                color = PaperFiber.copy(alpha = 0.022f),
                start = Offset(start, y),
                end = Offset((start + length).coerceAtMost(size.width), y + (index % 3 - 1) * 0.7f),
                strokeWidth = 0.55f,
            )
        }
    }
}

@Composable
private fun IssueRoute(
    state: IssueUiState,
    onRetry: () -> Unit,
    onOpenDates: () -> Unit,
    onDateSheet: (Boolean) -> Unit,
    onType: (IssueType) -> Unit,
    onDate: (String) -> Unit,
    adsEnabled: Boolean,
    privacyOptionsRequired: Boolean,
    onNaturalBreak: () -> Unit,
    onPrivacyOptions: () -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize()) {
        PaperTexture(Modifier.fillMaxSize(), PaperDeep)
        AnimatedContent(
            targetState = state,
            transitionSpec = { fadeIn(tween(180)) togetherWith fadeOut(tween(180)) },
            label = "issue-content",
        ) { current ->
            when {
                current.issue != null -> IssueScreen(
                    state = current,
                    onOpenDates = onOpenDates,
                    adsEnabled = adsEnabled,
                    privacyOptionsRequired = privacyOptionsRequired,
                    onNaturalBreak = onNaturalBreak,
                    onPrivacyOptions = onPrivacyOptions,
                )
                current.isInitialLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = InkBlue)
                }
                else -> ErrorState(current.error ?: "발행본을 불러오지 못했습니다.", onRetry)
            }
        }
        if (state.isDateSheetOpen) DateSheet(state, { onDateSheet(false) }, onType, onDate)
    }
}

@Composable
private fun IssueScreen(
    state: IssueUiState,
    onOpenDates: () -> Unit,
    adsEnabled: Boolean,
    privacyOptionsRequired: Boolean,
    onNaturalBreak: () -> Unit,
    onPrivacyOptions: () -> Unit,
) {
    val issue = requireNotNull(state.issue)
    val scrollState = rememberScrollState()
    val uriHandler = LocalUriHandler.current
    LaunchedEffect(adsEnabled, scrollState.value, scrollState.maxValue) {
        if (adsEnabled && scrollState.maxValue > 0 && scrollState.value >= scrollState.maxValue - 24) {
            onNaturalBreak()
        }
    }
    Surface(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 10.dp, vertical = 8.dp),
        color = Paper,
        shape = RoundedCornerShape(5.dp),
        shadowElevation = 8.dp,
        tonalElevation = 1.dp,
    ) {
        Box(Modifier.fillMaxSize()) {
            PaperTexture(Modifier.fillMaxSize())
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 22.dp)
                    .padding(top = 12.dp, bottom = 30.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Image(
                        painter = painterResource(R.drawable.jamsi_icon_source),
                        contentDescription = "잠시 신문 그림",
                        modifier = Modifier.size(68.dp),
                    )
                    Spacer(Modifier.width(11.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(
                            "잠시",
                            color = InkBlue,
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 23.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = (-0.4).sp,
                        )
                        Text(
                            "하루 한 번, 세상을 보는 잠시",
                            color = MutedInk,
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                }
                Spacer(Modifier.height(18.dp))
                TextButton(
                    onClick = onOpenDates,
                    colors = ButtonDefaults.textButtonColors(contentColor = InkBlue),
                    contentPadding = PaddingValues(0.dp),
                    modifier = Modifier
                        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                        .semantics { contentDescription = "발행 날짜 선택" },
                ) {
                    Text(
                        issue.displayDate,
                        fontFamily = FontFamily.SansSerif,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.3.sp,
                    )
                }
                HorizontalDivider(color = InkBlue, thickness = 3.dp)
                Spacer(Modifier.height(14.dp))
                Text(
                    issue.headline,
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 27.sp,
                    lineHeight = 35.sp,
                    fontWeight = FontWeight.Black,
                    color = Ink,
                    letterSpacing = (-0.3).sp,
                    style = TextStyle(
                        shadow = PrintShadow,
                        lineBreak = LineBreak.Heading,
                        hyphens = Hyphens.None,
                    ),
                )
                Spacer(Modifier.height(18.dp))
                HorizontalDivider(color = PrintRule.copy(alpha = 0.75f), thickness = 1.dp)
                Spacer(Modifier.height(16.dp))
                MarketBoard(state.marketSnapshot)

                issue.items.forEach { item ->
                    Column(modifier = Modifier.padding(vertical = 18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                "${item.order.toString().padStart(2, '0')} · ${item.category}",
                                color = MutedInk,
                                fontFamily = FontFamily.SansSerif,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.7.sp,
                            )
                            if (item.isHot) {
                                Surface(
                                    color = Accent.copy(alpha = 0.12f),
                                    contentColor = Accent,
                                    shape = RoundedCornerShape(3.dp),
                                ) {
                                    Text(
                                        "주요",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        fontFamily = FontFamily.SansSerif,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            item.title,
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 21.sp,
                            lineHeight = 29.sp,
                            fontWeight = FontWeight.Black,
                            color = Ink,
                            letterSpacing = (-0.2).sp,
                            style = TextStyle(
                                shadow = PrintShadow,
                                lineBreak = LineBreak.Heading,
                                hyphens = Hyphens.None,
                            ),
                        )
                    }
                    HorizontalDivider(color = PrintRule.copy(alpha = 0.28f), thickness = 0.8.dp)
                }

                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 18.dp),
                    color = InkBlue.copy(alpha = 0.055f),
                    shape = RoundedCornerShape(3.dp),
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(
                            "공식자료·복수 출처 교차검증 · 출처 ${issue.sourceCount}개",
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 11.sp,
                            lineHeight = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = MutedInk,
                        )
                        Text(
                            "최종 검수 ${issue.reviewedAt}",
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 11.sp,
                            lineHeight = 17.sp,
                            color = MutedInk,
                        )
                    }
                }
                if (state.isStaleCache) Text("마지막 저장본", modifier = Modifier.padding(top = 10.dp), fontSize = 11.sp, color = MutedInk)
                issue.correctionNote?.let { Text("정정 · $it", modifier = Modifier.padding(top = 10.dp), fontSize = 12.sp, color = Color(0xFF8F352F)) }
                if (state.appConfig.maintenanceEnabled) Text(state.appConfig.maintenanceMessage ?: "서비스 점검 안내가 적용 중입니다.", modifier = Modifier.padding(top = 14.dp), fontSize = 12.sp, color = Color(0xFF80661D))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    horizontalArrangement = Arrangement.Center,
                ) {
                    TextButton(onClick = { uriHandler.openUri("https://thedesignuncle.com/privacy6.html") }) {
                        Text("개인정보처리방침", fontSize = 11.sp)
                    }
                    if (privacyOptionsRequired) {
                        TextButton(onClick = onPrivacyOptions) { Text("개인정보 선택", fontSize = 11.sp) }
                    }
                }
                Text(
                    "© 2026 디자인하는삼촌 / 버전 ${BuildConfig.VERSION_NAME}",
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 11.sp,
                    color = MutedInk,
                )
            }
        }
    }
}

@Composable
private fun MarketBoard(snapshot: MarketSnapshot) {
    val quotes = snapshot.quotes
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("주식", color = Accent, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.1.sp)
                Spacer(Modifier.width(8.dp))
                Text("지금 시세", color = InkBlue, fontSize = 16.sp, fontWeight = FontWeight.Black)
            }
        }
        if (quotes.isNotEmpty()) {
            Column(modifier = Modifier.fillMaxWidth()) {
                quotes.chunked(2).forEach { rowQuotes ->
                    Row(modifier = Modifier.fillMaxWidth()) {
                        rowQuotes.forEach { quote ->
                            MarketCard(quote, Modifier.weight(1f))
                        }
                        if (rowQuotes.size == 1) Spacer(Modifier.weight(1f))
                    }
                    HorizontalDivider(color = PrintRule.copy(alpha = 0.2f), thickness = 0.6.dp)
                }
            }
        }
        Text(
            "${snapshot.basisDate.replace('-', '.').ifBlank { formatMarketUpdatedAt(snapshot.updatedAt).take(5) }} 종가 기준",
            modifier = Modifier.fillMaxWidth().padding(top = 6.dp, end = 2.dp),
            color = MutedInk,
            fontSize = 9.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.End,
        )
    }
}

@Composable
private fun MarketCard(quote: MarketQuote, modifier: Modifier = Modifier) {
    val changeColor = when {
        quote.change > 0 -> Color(0xFFD24C43)
        quote.change < 0 -> Color(0xFF2F64A0)
        else -> MutedInk
    }
    Column(modifier = modifier.padding(horizontal = 10.dp, vertical = 11.dp)) {
        Text(quote.name, color = MutedInk, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        Text(formatMarketNumber(quote.value), color = Ink, fontSize = 17.sp, fontWeight = FontWeight.Black)
        Text(
            "${formatSigned(quote.change)} · ${formatSigned(quote.changePercent)}%",
            color = changeColor,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}

private fun formatMarketNumber(value: Double): String = NumberFormat.getNumberInstance(Locale.KOREA).apply {
    minimumFractionDigits = 2
    maximumFractionDigits = 2
}.format(value)

private fun formatSigned(value: Double): String = "${if (value > 0) "+" else ""}${formatMarketNumber(value)}"

private fun formatMarketUpdatedAt(value: String): String = runCatching {
    val dateTime = OffsetDateTime.parse(value).atZoneSameInstant(ZoneId.of("Asia/Seoul"))
    dateTime.format(DateTimeFormatter.ofPattern("MM.dd HH:mm", Locale.KOREA)) + " 기준"
}.getOrDefault("시세 준비 중")

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun DateSheet(
    state: IssueUiState,
    onDismiss: () -> Unit,
    onType: (IssueType) -> Unit,
    onDate: (String) -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Paper,
        contentColor = Ink,
    ) {
        Box(Modifier.fillMaxWidth()) {
            PaperTexture(Modifier.fillMaxSize())
            Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 30.dp)) {
                Text("발행본 선택", fontFamily = FontFamily.SansSerif, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IssueType.entries.forEach { type ->
                        FilterChip(
                            selected = state.selectedType == type,
                            onClick = { onType(type) },
                            label = {
                                Text(when (type) {
                                    IssueType.DAILY -> "일간"
                                    IssueType.WEEKLY -> "주간"
                                    IssueType.MONTHLY -> "월간"
                                })
                            },
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
                if (state.availableDates.isEmpty()) Text("저장된 발행일이 없습니다.", color = MutedInk)
                state.availableDates.sortedDescending().forEach { date ->
                    TextButton(
                        onClick = { onDate(date) },
                        colors = ButtonDefaults.textButtonColors(contentColor = InkBlue),
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                    ) {
                        Text(if (date == state.selectedDate) "$date  · 현재" else date)
                    }
                }
            }
        }
    }
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(12.dp),
        color = Paper,
        shape = RoundedCornerShape(5.dp),
        shadowElevation = 8.dp,
    ) {
        Box(Modifier.fillMaxSize()) {
            PaperTexture(Modifier.fillMaxSize())
            Column(
                Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(message, fontFamily = FontFamily.SansSerif, color = Ink)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = InkBlue)) {
                    Text("다시 시도")
                }
            }
        }
    }
}
