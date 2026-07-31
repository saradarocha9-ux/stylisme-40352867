


/**
 * Configuração do app nativo (Android/iOS).
 * Use com: npx cap add android && npx cap sync
 * O plugin de anúncios: npm i @capacitor-community/admob
 *
 * No Android, o App ID do AdMob também precisa ir no AndroidManifest.xml:
 * <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
 *            android:value="ca-app-pub-9364980465425949~2081307777"/>
 * No iOS, em Info.plist: GADApplicationIdentifier = mesmo App ID.
 */
const config = {
  appId: "company.stylisme.app",
  appName: "Stylisme",
  webDir: "dist",
  server: {
    url: "https://stylisme.company",
    cleartext: false,
  },
};

export default config;
