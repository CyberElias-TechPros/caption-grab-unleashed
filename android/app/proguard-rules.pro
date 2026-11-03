# Kotlin serialization keeps working in release builds.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**

-keepclassmembers class com.captiongrab.app.data.** {
    *** Companion;
}
-keepclasseswithmembers class com.captiongrab.app.data.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.captiongrab.app.data.**$$serializer { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Coil
-dontwarn coil.**
