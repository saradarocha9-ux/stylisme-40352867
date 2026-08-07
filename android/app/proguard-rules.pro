# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep line number information for debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# Hide the original source file name.
-renamesourcefileattribute SourceFile

# Capacitor / Cordova bridge
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep public class com.getcapacitor.community.admob.** { *; }
-keep public class com.stylisme.inteli.** { *; }

# AndroidX
-keep public class androidx.core.content.FileProvider { *; }
-keep public class androidx.appcompat.** { *; }
-keep public class androidx.coordinatorlayout.** { *; }
-keep public class androidx.core.splashscreen.** { *; }

# Google Mobile Ads / Play Services
-keep public class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**
-keep public class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.common.**

# WebView / JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Serialization / reflection used by Capacitor plugins
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep BuildConfig
-keep public class com.stylisme.inteli.BuildConfig { *; }
