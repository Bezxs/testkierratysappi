# 3. Shared — tietomallit, rajapinta ja lajittelulogiikka

`domain/` sisältää normalisoidut havainnot, GTIN/materiaalikoodit ja muut puhtaat
tietomallit. `contracts/` sisältää yhteisen lookup-v1-sopimuksen ja pisteaineiston
v2-skeeman. `recycling-engine/` sisältää versioidut suomalaiset säännöt,
selitykset, epävarmuuden ja provenienssin. Tässä ei ole HTTP-palvelinta,
provider-verkkopyyntöjä, laitetietoa, tietokantayhteyttä, UI:ta tai salaisuuksia.

Root-kansiosta:

```sh
pnpm validate:shared
pnpm validate
```

Ensimmäinen tarkistaa vain sharedin; jälkimmäinen tarkistaa myös molemmat
käyttäjät. Sharedin muutoksissa koko integraatio on pakollinen, koska esimerkiksi
materiaalin tai säännön muutos voi vaikuttaa sekä online- että offline-ohjeeseen.
Omilla testeillä ei voi todistaa, ettei muutos vaikuta käyttäjiin.

Shared ei saa riippua mobile- tai backend-paketeista, UI/natiivikirjastoista eikä
palvelin/tietokanta-ajosta. Käytä pakettien julkisia exportteja. Säilytä v1-
HTTP-sopimus: älä nimeä kenttiä/tiloja uudelleen tai poista niitä hiljaa. Uusi
rikkova versio tarvitsee rinnakkaisen reitin ja koordinoidun käyttöönoton.

Säännön muutos tarvitsee lähteen, Suomen soveltamisalueen, tarkistuspäivän ja
uuden version. Älä sekoita kierrätyspisteen OSM-vastaanottoraporttia tarkistettuun
lajittelusääntöön tai arvaa pakkauksen/tuotteen ominaisuuksia. Testien synteettisiä
esimerkkejä ei saa viedä oikeaksi runtime-dataksi.
