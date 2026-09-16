import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.devtools.ksp")
}

val admobAppId = providers.gradleProperty("JAMSI_ADMOB_APP_ID").orElse("ca-app-pub-3940256099942544~3347511713")
val admobBannerId = providers.gradleProperty("JAMSI_ADMOB_BANNER_ID").orElse("ca-app-pub-3940256099942544/9214589741")
val admobInterstitialId = providers.gradleProperty("JAMSI_ADMOB_INTERSTITIAL_ID").orElse("ca-app-pub-3940256099942544/1033173712")
val admobTestAppId = "ca-app-pub-3940256099942544~3347511713"
val admobTestBannerId = "ca-app-pub-3940256099942544/9214589741"
val admobTestInterstitialId = "ca-app-pub-3940256099942544/1033173712"
val screenshotMode = providers.gradleProperty("JAMSI_SCREENSHOT_MODE").orElse("false").map(String::toBoolean)
val releaseKeystorePropertiesFile = rootProject.file("../release/keystore.properties")
val releaseKeystoreProperties = Properties().apply {
    if (releaseKeystorePropertiesFile.exists()) releaseKeystorePropertiesFile.inputStream().use(::load)
}

android {
    namespace = "com.thedesignuncle.jamsi"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.thedesignuncle.jamsi"
        minSdk = 23
        targetSdk = 36
        versionCode = 6
        versionName = "1.0.04"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "API_BASE_URL", "\"${providers.gradleProperty("JAMSI_API_BASE_URL").orElse("http://10.0.2.2:8000/").get()}\"")
        buildConfigField("String", "FIREBASE_API_KEY", "\"${providers.gradleProperty("JAMSI_FIREBASE_API_KEY").orElse("").get()}\"")
        buildConfigField("String", "FIREBASE_PROJECT_ID", "\"${providers.gradleProperty("JAMSI_FIREBASE_PROJECT_ID").orElse("").get()}\"")
        buildConfigField("String", "FIREBASE_APP_ID", "\"${providers.gradleProperty("JAMSI_FIREBASE_APP_ID").orElse("").get()}\"")
        buildConfigField("Boolean", "ADS_ENABLED", "false")
        buildConfigField("String", "ADMOB_BANNER_ID", "\"${admobBannerId.get()}\"")
        buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"${admobInterstitialId.get()}\"")
        manifestPlaceholders["admobAppId"] = admobAppId.get()
    }

    signingConfigs {
        if (releaseKeystorePropertiesFile.exists()) {
            create("release") {
                storeFile = rootProject.file(releaseKeystoreProperties.getProperty("storeFile"))
                storePassword = releaseKeystoreProperties.getProperty("storePassword")
                keyAlias = releaseKeystoreProperties.getProperty("keyAlias")
                keyPassword = releaseKeystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            buildConfigField("Boolean", "ADS_ENABLED", if (screenshotMode.get()) "false" else "true")
            buildConfigField("String", "ADMOB_BANNER_ID", "\"$admobTestBannerId\"")
            buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"$admobTestInterstitialId\"")
            manifestPlaceholders["admobAppId"] = admobTestAppId
            versionNameSuffix = "-debug"
        }
        create("staging") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            matchingFallbacks += listOf("debug")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            buildConfigField("Boolean", "ADS_ENABLED", "true")
            if (releaseKeystorePropertiesFile.exists()) signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.3")
    val composeBom = platform("androidx.compose:compose-bom:2026.06.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.10.0")
    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")
    implementation("androidx.work:work-runtime-ktx:2.11.2")
    implementation("androidx.core:core-ktx:1.17.0")
    implementation(platform("com.google.firebase:firebase-bom:34.16.0"))
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.android.gms:play-services-ads:25.4.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.10.2")
    implementation(platform("com.squareup.retrofit2:retrofit-bom:3.0.0"))
    implementation("com.squareup.retrofit2:retrofit")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

val verifyReleaseAdMobIds by tasks.registering {
    doLast {
        val ids = listOf(admobAppId.get(), admobBannerId.get(), admobInterstitialId.get())
        require(ids.none { it.contains("3940256099942544") }) {
            "Google Play 출시 전 JAMSI_ADMOB_APP_ID, JAMSI_ADMOB_BANNER_ID, JAMSI_ADMOB_INTERSTITIAL_ID에 실제 AdMob ID를 설정하세요."
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    dependsOn(verifyReleaseAdMobIds)
}
