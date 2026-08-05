


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
  appId: "com.stylisme.inteli",
  appName: "Stylisme",
  // O app nativo usa o domínio publicado para manter IA, pagamentos e backend.
  // Este shell local existe apenas como fallback exigido pelo empacotamento.
  webDir: "native-shell",
  server: {
    url: "https://stylisme.company",
    cleartext: false,
  },
};

export default config;
