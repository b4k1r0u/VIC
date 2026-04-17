# scripts/build_commune_zones.py
"""
Build the commune_zones.csv lookup table by:
1. Parsing the RPA 99 Annexe 1 (already done manually for key wilayas)
2. Cross-referencing with the Code Géographique national
3. Outputting: wilaya_code, commune_name, zone_sismique, lat, lon
"""

import pandas as pd
import requests
import time

# ─── STEP 1: The RPA 99 zone classifications (from manual extraction of Annexe 1) ───
# This is the result of reading the PDF — you build this dict manually.
# Format: wilaya_code → default_zone (or dict of commune_group → zone for split wilayas)

RPA_ZONES = {
    "01": "0",     # Adrar — all communes Zone 0
    "02": {        # Chlef — split wilaya
        "default": "III",
        "IIb": ["EL KARIMIA", "HARCHOUN", "SENDJAS", "OUED SLY", "BOUKADIR"],
        "IIa": ["OULED BEN ABD EL KADER HADJADJ"]
    },
    "03": "I",     # Laghouat
    "04": "I",     # Oum El Bouaghi
    "05": "I",     # Batna
    "06": "IIa",   # Béjaïa
    "07": "I",     # Biskra
    "08": "I",     # Béchar
    "09": {        # Blida — split
        "default": "III",
        "IIb": ["MEFTAH", "DJEBABRA", "SOUHANE", "LARBAA",
                "OULED SELAMA", "BOUGARA", "HAMMAM MELOUANE", "AIN ROMANA"]
    },
    "10": "IIa",   # Bouira
    "11": "0",     # Tamanrasset
    "12": "I",     # Tébessa
    "13": "I",     # Tlemcen
    "14": "I",     # Tiaret
    "15": {        # Tizi Ouzou — split
        "default": "IIa",
        "IIb": ["MIZRANA"]  # Groupe A is IIb, rest is IIa
    },
    "16": "III",   # Alger — all Zone III
    "17": "I",     # Djelfa
    "18": "IIa",   # Jijel
    "19": "IIa",   # Sétif
    "20": "I",     # Saïda
    "21": "IIa",   # Skikda
    "22": "I",     # Sidi Bel Abbès
    "23": "IIa",   # Annaba
    "24": "IIa",   # Guelma
    "25": "IIa",   # Constantine
    "26": {        # Médéa — split
        "default": "IIb",
        "IIa": ["EL HAMDANIA", "MEDEA", "TAMESGUIDA"],
        "I":   ["BOU AICHE", "CHAHBOUNIA", "BOUGHZOUL", "SAREG", "MEFTAHA",
                "OULED MAREF", "EL AOUNET", "AIN BOUCIF", "SIDI DAMED",
                "AIN OUKSIR", "CHENIGUEL"]
    },
    "27": {        # Mostaganem — split
        "default": "IIa",
        "III": ["OULED BOUGHALEM", "ACHAACHA", "KHADRA", "NEKMARIA"],
        "IIb": ["SIDI LAKHDAR", "TASGHAIT", "OULED MAALAH"]
    },
    "28": {        # M'Sila — split
        "default": "I",
        "IIa": ["BENI ILMANE", "OUNOUGHA", "HAMMAM DALAA", "TARMOUNT",
                "OULED MANSOUR", "M'SILA", "M'TARFA", "MAADID", "OULED DERRADJ",
                "OULED ADDI", "DAHAHNA", "BERHOUM", "AIN KADRA", "MAGRA", "BELAIBA"]
    },
    "29": {        # Mascara — split
        "default": "IIa",
        "I":   ["AIN FARES", "AIN FEKRAN", "BOUHANIFIA", "GUERDJOU", "OUED TARIA",
                "GHRIS", "BENAIN", "MOKHDA", "AOUF", "GHAROUS", "NESMOT",
                "M'HAMID", "HACHEM", "OUED EL ABTAL", "AIN FERRAH"]
    },
    "30": "0",     # Ouargla
    "31": "IIa",   # Oran
    "32": "I",     # El Bayadh
    "33": "0",     # Illizi
    "34": {        # Bordj Bou Arréridj — split
        "default": "IIa",
        "III": [],  # Groupe A (main communes)
        "IIb": [],  # Groupe B
        "IIa": []   # Groupe C (default)
    },
    "35": {        # Boumerdès — split
        "default": "III",
        "IIb": ["AFIR", "BENCHOUD", "TAOUERGA", "BAGHLIA", "OUED AISSA",
                "NACIRIA", "BORDJ MENAIL", "ISSER", "BENI AMRANE", "SOUK EL HAD",
                "BOUZEGZA KEDAR", "EL KHAROUBA", "LARBATACHE",
                "KHEMIS EL KHECHNA", "OULED MOUSSA", "HAMMADI"],
        "IIa": ["TIMEZRIT", "AMMAL", "CHAABET EL AMEUR"]
    },
    "36": "IIa",   # El Tarf
    "37": "0",     # Tindouf
    "38": "IIa",   # Tissemsilt
    "39": "0",     # El Oued
    "40": "I",     # Khenchela
    "41": "I",     # Souk Ahras
    "42": "III",   # Tipaza — all Zone III
    "43": "IIa",   # Mila
    "44": {        # Aïn Defla — split
        "default": "IIa",
        "III": ["TACHETA", "ZOUGAGHA", "EL ABADIA", "AIN BOUYAHIA", "EL ATTAF"],
        "IIb": ["EL AMRA", "MEKHATRIA", "ARIB", "ROUINA", "AIN DEFLA", "BOURACHED",
                "ZEDDINE", "TIBERKANINE", "SEN ALLAH", "MELIANA", "AIN TORKI",
                "HAMMAM RIGHA", "AIN BENIAN", "HOUCEINIA", "BOUMADFAA"]
    },
    "45": "I",     # Naâma
    "46": "IIa",   # Aïn Témouchent
    "47": "0",     # Ghardaïa
    "48": {        # Relizane — split
        "default": "IIa",
        "III": ["MEDIOUNA", "SIDI M'HAMED BEN ALI", "MAZOUNA", "EL GUETTAR"],
        "IIb": ["MERDJA SIDI ABED", "OUED RHIOU", "OUARTZENZ",
                "DJIDIOUIA", "HAMRI", "BENI ZENTIS"]
    }
}

def get_zone(wilaya_code: str, commune_name: str) -> str:
    """
    Resolve the RPA seismic zone for a given wilaya + commune.
    Handles both simple (single zone) and split wilayas.
    """
    zone_config = RPA_ZONES.get(wilaya_code.zfill(2))
    if zone_config is None:
        return "UNKNOWN"

    if isinstance(zone_config, str):
        return zone_config  # whole wilaya is one zone

    # Split wilaya — check commune against each group
    commune_upper = commune_name.upper().strip()
    for zone, communes in zone_config.items():
        if zone == "default":
            continue
        if any(commune_upper in c.upper() or c.upper() in commune_upper
               for c in communes):
            return zone

    return zone_config["default"]


def geocode_commune(commune_name: str, wilaya_name: str) -> tuple[float, float]:
    """
    Get lat/lon for a commune using OpenStreetMap Nominatim.
    Rate limited to 1 req/sec per OSM ToS.
    """
    query = f"{commune_name}, {wilaya_name}, Algeria"
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": query, "format": "json", "limit": 1}
    headers = {"User-Agent": "RASED-Hackathon/1.0"}

    try:
        r = requests.get(url, params=params, headers=headers, timeout=5)
        results = r.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass

    return None, None


def build_lookup_table(portfolio_df: pd.DataFrame) -> pd.DataFrame:
    """
    Build commune_zones.csv from portfolio data.
    Enriches each unique (wilaya_code, commune_name) pair with zone + coordinates.
    """
    # Extract unique commune × wilaya pairs from portfolio
    unique_communes = portfolio_df[["wilaya_code", "commune_name", "wilaya_name"]].drop_duplicates()

    results = []
    for _, row in unique_communes.iterrows():
        zone = get_zone(str(row["wilaya_code"]).zfill(2), row["commune_name"])
        lat, lon = geocode_commune(row["commune_name"], row["wilaya_name"])
        results.append({
            "wilaya_code": str(row["wilaya_code"]).zfill(2),
            "wilaya_name": row["wilaya_name"],
            "commune_name": row["commune_name"],
            "zone_sismique": zone,
            "lat": lat,
            "lon": lon,
        })
        time.sleep(1.1)  # Nominatim rate limit

    df = pd.DataFrame(results)
    df.to_csv("data/commune_zones.csv", index=False)
    print(f"Built lookup table: {len(df)} communes, {df['zone_sismique'].value_counts().to_dict()}")
    return df