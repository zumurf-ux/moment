package com.thedesignuncle.jamsi.issue

import com.thedesignuncle.jamsi.model.Issue
import com.thedesignuncle.jamsi.model.IssueType
import com.thedesignuncle.jamsi.model.AppConfig
import com.thedesignuncle.jamsi.model.MarketSnapshot

enum class AdLoadState { DISABLED, LOADING, READY, ERROR }

data class IssueUiState(
    val isInitialLoading: Boolean = true,
    val issue: Issue? = null,
    val selectedDate: String = "2026-08-06",
    val selectedType: IssueType = IssueType.DAILY,
    val availableDates: Set<String> = setOf("2026-08-06"),
    val isDateSheetOpen: Boolean = false,
    val isStaleCache: Boolean = false,
    val bannerState: AdLoadState = AdLoadState.DISABLED,
    val appConfig: AppConfig = AppConfig(),
    val marketSnapshot: MarketSnapshot = MarketSnapshot(),
    val error: String? = null,
)
