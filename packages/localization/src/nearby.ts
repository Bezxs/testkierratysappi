export const nearbyFi = {
  nearbyNameUnknown: "Pisteen nimeä ei ole aineistossa",
  nearbyPointType: "Pisteen tyyppi aineistossa",
  nearbyTypeUnknown: "Tyyppiä ei ole ilmoitettu",
  nearbyPointId: "Pisteen lähdetunniste",
  nearbyTitle: "Lähin kierrätyspaikka",
  nearbyHomeBody: "Etäisyys omasta sijainnistasi · Suomen pisteet",
  nearbyPurpose:
    "Käytämme sijaintia kerran lähimmän aineistossa olevan pisteen löytämiseen. Etäisyys lasketaan puhelimessa. Sijaintia ei tallenneta, lähetetä tai seurata taustalla.",
  nearbyFind: "Etsi sijainnillani",
  nearbyRefresh: "Päivitä sijainti",
  nearbyLoading: "Määritetään sijaintia…",
  nearbyScope: "Suomi · yhteisön ylläpitämä aineisto",
  nearbyEstimate: "Arvio linnuntietä",
  nearbyResult: "Lähin piste tällä sijaintiarviolla",
  nearbyGeneric: "Kierrätyspiste",
  nearbyCentre: "Kierrätysasema",
  nearbyContainer: "Kierrätysastia tai -piste",
  nearbyAccuracy: "Sijainnin ilmoitettu tarkkuus",
  nearbyApproximate: "Sijainti on epätarkka. Lähimpien pisteiden järjestys voi vaihdella.",
  nearbyCaution:
    "Luettelo voi olla puutteellinen. Tarkista vastaanotettavat materiaalit, käyttöoikeus ja aukiolo ennen lähtöä. Etäisyys ei ole kulkureitti; aluekohteen sijainti voi olla sen keskipiste, ei sisäänkäynti.",
  nearbyRetrieved: "Aineisto haettu",
  nearbyUnverified: "Yhteisötieto · ei paikan päällä varmennettu",
  nearbyStale:
    "Aineisto on yli 30 päivää vanha. Tarkista pisteen ajantasaiset tiedot ennen lähtöä.",
  nearbySource: "© OpenStreetMap contributors · ODbL 1.0",
  nearbyDetails: "Avaa pisteen lähdetiedot",
  nearbyExternalHint: "Avaa OpenStreetMapin selaimessa. Oma sijaintisi ei sisälly linkkiin.",
  nearbyPermission:
    "Sijaintilupaa ei annettu. Voit yrittää uudelleen tai sallia sijainnin sovelluksen asetuksissa. Muut toiminnot toimivat ilman lupaa.",
  nearbyServices:
    "Laitteen sijaintipalvelut ovat pois päältä. Ota ne käyttöön asetuksissa ja yritä uudelleen.",
  nearbyTimeout:
    "Sijaintia ei saatu 20 sekunnissa. Siirry avoimempaan paikkaan ja yritä uudelleen.",
  nearbyUnavailable:
    "Sijaintia ei saada nyt. Tarkista laitteen tai selaimen sijaintiasetukset ja yritä uudelleen.",
  nearbyDataError:
    "Paikallista kierrätyspisteaineistoa ei voida käyttää. Päivitä sovellus. Emme arvaa lähintä pistettä.",
  nearbyNoResult:
    "Aineistossa ei ole pistettä 100 kilometrin säteellä tästä sijaintiarviosta. Aineisto kattaa vain Suomeen merkittyjä pisteitä eikä ole täydellinen.",
  nearbyLinkError: "Lähdelinkkiä ei voitu avata. Tarkista verkkoyhteys ja yritä uudelleen.",
  nearbySettingsHint: "Jos käytät selainta, muuta sijaintilupa selaimen sivustoasetuksissa.",
  nearbyPrivacy:
    "Vapaaehtoinen lähimmän pisteen haku käsittelee sijaintia vain laitteen muistissa. Lukeminen loppuu tulokseen, peruutukseen tai aikakatkaisuun; näkymästä poistuminen tai sovelluksen siirtäminen taustalle tyhjentää tuloksen. Sijaintia tai siitä laskettua etäisyyttä ei tallenneta historiaan, lähetetä palvelimelle tai analytiikkaan. OpenStreetMap-lähdelinkki välittää vain julkisen pisteen tunnisteen; selaimen verkkopyyntöön sovelletaan ulkoisen palvelun tietosuojakäytäntöä.",
};

export const nearbyEn: Record<keyof typeof nearbyFi, string> = {
  nearbyNameUnknown: "Point name is not available in the directory",
  nearbyPointType: "Point type reported in the directory",
  nearbyTypeUnknown: "Type not reported",
  nearbyPointId: "Point source identifier",
  nearbyTitle: "Nearest recycling point",
  nearbyHomeBody: "Distance from your location · Finnish points",
  nearbyPurpose:
    "Use your location once to find the nearest point in the directory. Distance is calculated on your phone. Your location is not stored, uploaded or tracked in the background.",
  nearbyFind: "Find using my location",
  nearbyRefresh: "Update location",
  nearbyLoading: "Finding your location…",
  nearbyScope: "Finland · community-maintained directory",
  nearbyEstimate: "Estimated straight-line distance",
  nearbyResult: "Nearest point for this location estimate",
  nearbyGeneric: "Recycling point",
  nearbyCentre: "Recycling centre",
  nearbyContainer: "Recycling container or point",
  nearbyAccuracy: "Reported location accuracy",
  nearbyApproximate: "Your location is approximate. The order of nearby points may vary.",
  nearbyCaution:
    "The directory may be incomplete. Check accepted materials, access and opening hours before travelling. Distance is not a route; an area may be represented by its centre, not its entrance.",
  nearbyRetrieved: "Directory retrieved",
  nearbyUnverified: "Community data · not verified on site",
  nearbyStale:
    "This directory is over 30 days old. Check the point's current details before travelling.",
  nearbySource: "© OpenStreetMap contributors · ODbL 1.0",
  nearbyDetails: "Open point's source details",
  nearbyExternalHint:
    "Opens OpenStreetMap in your browser. Your location is not included in the link.",
  nearbyPermission:
    "Location permission was not granted. Try again or allow location in the app settings. Other features work without permission.",
  nearbyServices: "Device location services are off. Turn them on in settings and try again.",
  nearbyTimeout:
    "No location was available within 20 seconds. Move to a more open area and try again.",
  nearbyUnavailable:
    "Location is unavailable. Check your device or browser location settings and try again.",
  nearbyDataError:
    "The local recycling directory cannot be used. Update the app. We will not guess the nearest point.",
  nearbyNoResult:
    "No point in the directory is within 100 kilometres of this location estimate. This incomplete directory only covers points mapped in Finland.",
  nearbyLinkError: "The source link could not be opened. Check your connection and try again.",
  nearbySettingsHint: "In a browser, change location permission in its site settings.",
  nearbyPrivacy:
    "The optional nearest-point search processes your location in device memory only. Acquisition ends on a result, cancellation or timeout; leaving the screen or backgrounding the app clears the result. Neither location nor calculated distance is saved to history, sent to a server or analytics. OpenStreetMap source links contain only the public point ID; browser requests are subject to the external service's privacy policy.",
};
