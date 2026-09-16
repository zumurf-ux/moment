package com.thedesignuncle.jamsi.model

enum class IssueType { DAILY, WEEKLY, MONTHLY }

data class IssueItem(
    val order: Int,
    val category: String,
    val title: String,
    val summary: String,
    val isHot: Boolean = false,
    val sourceName: String = "",
    val sourceUrl: String = "",
    val factDate: String = "",
)

data class Issue(
    val id: String,
    val type: IssueType,
    val publishDate: String,
    val displayDate: String,
    val version: Int,
    val headline: String,
    val items: List<IssueItem>,
    val closingText: String,
    val sourceCount: Int,
    val reviewedAt: String,
    val correctionNote: String? = null,
)

data class AppConfig(
    val adsEnabled: Boolean = false,
    val interstitialMinSeconds: Int = 60,
    val interstitialMaxPerSession: Int = 1,
    val interstitialPlacement: String = "natural_break",
    val maintenanceEnabled: Boolean = false,
    val maintenanceMessage: String? = null,
    val minimumVersion: String = "1.0.0",
)

data class MarketQuote(
    val symbol: String,
    val name: String,
    val value: Double,
    val change: Double,
    val changePercent: Double,
    val currency: String = "",
)

data class MarketSnapshot(
    val quotes: List<MarketQuote> = emptyList(),
    val updatedAt: String = "",
    val basisDate: String = "",
    val delayed: Boolean = true,
)
