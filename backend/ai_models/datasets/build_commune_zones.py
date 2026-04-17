"""
Build the commune_zones.csv lookup table from the real CATNAT workbook.

Outputs a checkpointed lookup with:
- wilaya_code
- wilaya_name
- commune_name
- zone_sismique
- zone_source
- lat
- lon
- coordinate_source
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import pandas as pd
import requests

DATA_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_OUTPUT_PATH = DATA_DIR / "commune_zones.csv"

# RPA 99 Annexe 1 classifications for the historical 48 wilayas.
RPA_ZONES = {
    "01": "0",
    "02": {
        "default": "III",
        "IIb": ["EL KARIMIA", "HARCHOUN", "SENDJAS", "OUED SLY", "BOUKADIR"],
        "IIa": ["OULED BEN ABD EL KADER HADJADJ"],
    },
    "03": "I",
    "04": "I",
    "05": "I",
    "06": "IIa",
    "07": "I",
    "08": "I",
    "09": {
        "default": "III",
        "IIb": [
            "MEFTAH",
            "DJEBABRA",
            "SOUHANE",
            "LARBAA",
            "OULED SELAMA",
            "BOUGARA",
            "HAMMAM MELOUANE",
            "AIN ROMANA",
        ],
    },
    "10": "IIa",
    "11": "0",
    "12": "I",
    "13": "I",
    "14": "I",
    "15": {"default": "IIa", "IIb": ["MIZRANA"]},
    "16": "III",
    "17": "I",
    "18": "IIa",
    "19": "IIa",
    "20": "I",
    "21": "IIa",
    "22": "I",
    "23": "IIa",
    "24": "IIa",
    "25": "IIa",
    "26": {
        "default": "IIb",
        "IIa": ["EL HAMDANIA", "MEDEA", "TAMESGUIDA"],
        "I": [
            "BOU AICHE",
            "CHAHBOUNIA",
            "BOUGHZOUL",
            "SAREG",
            "MEFTAHA",
            "OULED MAREF",
            "EL AOUNET",
            "AIN BOUCIF",
            "SIDI DAMED",
            "AIN OUKSIR",
            "CHENIGUEL",
        ],
    },
    "27": {
        "default": "IIa",
        "III": ["OULED BOUGHALEM", "ACHAACHA", "KHADRA", "NEKMARIA"],
        "IIb": ["SIDI LAKHDAR", "TASGHAIT", "OULED MAALAH"],
    },
    "28": {
        "default": "I",
        "IIa": [
            "BENI ILMANE",
            "OUNOUGHA",
            "HAMMAM DALAA",
            "TARMOUNT",
            "OULED MANSOUR",
            "M'SILA",
            "M'TARFA",
            "MAADID",
            "OULED DERRADJ",
            "OULED ADDI",
            "DAHAHNA",
            "BERHOUM",
            "AIN KADRA",
            "MAGRA",
            "BELAIBA",
        ],
    },
    "29": {
        "default": "IIa",
        "I": [
            "AIN FARES",
            "AIN FEKRAN",
            "BOUHANIFIA",
            "GUERDJOU",
            "OUED TARIA",
            "GHRIS",
            "BENAIN",
            "MOKHDA",
            "AOUF",
            "GHAROUS",
            "NESMOT",
            "M'HAMID",
            "HACHEM",
            "OUED EL ABTAL",
            "AIN FERRAH",
        ],
    },
    "30": "0",
    "31": "IIa",
    "32": "I",
    "33": "0",
    "34": {"default": "IIa", "III": [], "IIb": [], "IIa": []},
    "35": {
        "default": "III",
        "IIb": [
            "AFIR",
            "BENCHOUD",
            "TAOUERGA",
            "BAGHLIA",
            "OUED AISSA",
            "NACIRIA",
            "BORDJ MENAIL",
            "ISSER",
            "BENI AMRANE",
            "SOUK EL HAD",
            "BOUZEGZA KEDAR",
            "EL KHAROUBA",
            "LARBATACHE",
            "KHEMIS EL KHECHNA",
            "OULED MOUSSA",
            "HAMMADI",
        ],
        "IIa": ["TIMEZRIT", "AMMAL", "CHAABET EL AMEUR"],
    },
    "36": "IIa",
    "37": "0",
    "38": "IIa",
    "39": "0",
    "40": "I",
    "41": "I",
    "42": "III",
    "43": "IIa",
    "44": {
        "default": "IIa",
        "III": ["TACHETA", "ZOUGAGHA", "EL ABADIA", "AIN BOUYAHIA", "EL ATTAF"],
        "IIb": [
            "EL AMRA",
            "MEKHATRIA",
            "ARIB",
            "ROUINA",
            "AIN DEFLA",
            "BOURACHED",
            "ZEDDINE",
            "TIBERKANINE",
            "SEN ALLAH",
            "MELIANA",
            "AIN TORKI",
            "HAMMAM RIGHA",
            "AIN BENIAN",
            "HOUCEINIA",
            "BOUMADFAA",
        ],
    },
    "45": "I",
    "46": "IIa",
    "47": "0",
    "48": {
        "default": "IIa",
        "III": ["MEDIOUNA", "SIDI M'HAMED BEN ALI", "MAZOUNA", "EL GUETTAR"],
        "IIb": [
            "MERDJA SIDI ABED",
            "OUED RHIOU",
            "OUARTZENZ",
            "DJIDIOUIA",
            "HAMRI",
            "BENI ZENTIS",
        ],
    },
}

# Administrative wilayas added after the original 48-wilaya RPA document.
# Their zone here is inherited from the parent historical wilaya used by the data.
POST_48_INHERITED_ZONES = {
    "49": "0",  # Timimoun -> inherited from Adrar belt
    "50": "0",  # Bordj Badji Mokhtar -> inherited from southern Adrar/Tamanrasset belt
    "51": "I",  # Ouled Djellal -> inherited from Biskra
    "53": "0",  # In Salah -> inherited from Tamanrasset
    "54": "0",  # In Guezzam -> inherited from Tamanrasset
    "55": "0",  # Touggourt -> inherited from Ouargla
    "56": "0",  # Djanet -> inherited from Illizi
    "57": "0",  # El M'Ghair -> inherited from El Oued
}

GEOCODE_WILAYA_NAME_OVERRIDES = {
    "AIN TIMOUCHENT": "AIN TEMOUCHENT",
    "B.B ARRERIDJ": "BORDJ BOU ARRERIDJ",
    "EL MGHAIR": "EL M'GHAIR",
    "EL TAREF": "EL TARF",
    "M SILA": "M'SILA",
    "OURGLA": "OUARGLA",
    "TAMENRASSET": "TAMANRASSET",
}


def normalize_name(value: object) -> str:
    return " ".join(str(value).upper().strip().split())


def get_zone_and_source(wilaya_code: str, commune_name: str) -> tuple[str, str]:
    code = str(wilaya_code).zfill(2)
    zone_config = RPA_ZONES.get(code)

    if zone_config is None and code in POST_48_INHERITED_ZONES:
        return POST_48_INHERITED_ZONES[code], "inferred_from_parent_wilaya"

    if zone_config is None:
        return "UNKNOWN", "unknown"

    if isinstance(zone_config, str):
        return zone_config, "rpa99_annex"

    commune_upper = normalize_name(commune_name)
    for zone, communes in zone_config.items():
        if zone == "default":
            continue
        if any(commune_upper in normalize_name(c) or normalize_name(c) in commune_upper for c in communes):
            return zone, "rpa99_annex"

    return zone_config["default"], "rpa99_annex"


def get_zone(wilaya_code: str, commune_name: str) -> str:
    return get_zone_and_source(wilaya_code, commune_name)[0]


def _search_nominatim(query: str) -> tuple[float | None, float | None]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "dz"}
    headers = {"User-Agent": "RASED-Hackathon/1.0 (portfolio-enrichment)"}

    last_error = None
    for attempt in range(3):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            results = response.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
            return None, None
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(2 * (attempt + 1))

    print(f"Geocoding failed for {query!r}: {last_error}")
    return None, None


def geocode_commune(commune_name: str, wilaya_name: str) -> tuple[float | None, float | None, str]:
    geocode_wilaya_name = GEOCODE_WILAYA_NAME_OVERRIDES.get(
        normalize_name(wilaya_name),
        wilaya_name,
    )

    primary_query = f"{commune_name}, {geocode_wilaya_name}, Algeria"
    lat, lon = _search_nominatim(primary_query)
    if lat is not None and lon is not None:
        return lat, lon, "nominatim_commune_wilaya"

    fallback_query = f"{commune_name}, Algeria"
    lat, lon = _search_nominatim(fallback_query)
    if lat is not None and lon is not None:
        return lat, lon, "nominatim_commune_only_fallback"

    return None, None, "missing"


def build_lookup_table(
    portfolio_df: pd.DataFrame,
    output_path: Path | str = DEFAULT_OUTPUT_PATH,
) -> pd.DataFrame:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    unique_communes = (
        portfolio_df[["wilaya_code", "commune_name", "wilaya_name"]]
        .dropna()
        .drop_duplicates()
        .sort_values(["wilaya_code", "commune_name"])
        .reset_index(drop=True)
    )

    existing = pd.DataFrame()
    if output_path.exists():
        existing = pd.read_csv(output_path, dtype={"wilaya_code": str})
        if not existing.empty:
            existing["wilaya_code"] = existing["wilaya_code"].astype(str).str.zfill(2)
            existing["commune_name"] = existing["commune_name"].map(normalize_name)

    existing_lookup: dict[tuple[str, str], dict[str, object]] = {}
    if not existing.empty:
        existing_lookup = {
            (row["wilaya_code"], row["commune_name"]): row
            for _, row in existing.to_dict(orient="index").items()
        }

    results: list[dict[str, object]] = []
    total = len(unique_communes)

    for idx, row in unique_communes.iterrows():
        wilaya_code = str(row["wilaya_code"]).zfill(2)
        commune_name = normalize_name(row["commune_name"])
        wilaya_name = row["wilaya_name"]
        zone, zone_source = get_zone_and_source(wilaya_code, commune_name)

        cached = existing_lookup.get((wilaya_code, commune_name))
        if cached and pd.notna(cached.get("lat")) and pd.notna(cached.get("lon")):
            lat = float(cached["lat"])
            lon = float(cached["lon"])
            coordinate_source = "cache"
        else:
            lat, lon, coordinate_source = geocode_commune(commune_name, wilaya_name)
            time.sleep(1.1)

        results.append(
            {
                "wilaya_code": wilaya_code,
                "wilaya_name": wilaya_name,
                "commune_name": commune_name,
                "zone_sismique": zone,
                "zone_source": zone_source,
                "lat": lat,
                "lon": lon,
                "coordinate_source": coordinate_source,
            }
        )

        if (idx + 1) % 25 == 0 or (idx + 1) == total:
            pd.DataFrame(results).to_csv(output_path, index=False)
            print(f"Checkpoint: {idx + 1}/{total} communes written to {output_path}")

    df = pd.DataFrame(results)
    print(f"Built lookup table: {len(df)} unique wilaya/commune pairs")
    print(f"Zone distribution: {df['zone_sismique'].value_counts(dropna=False).to_dict()}")
    print(f"Zone source distribution: {df['zone_source'].value_counts(dropna=False).to_dict()}")
    print(f"Coordinates missing: {int(df['lat'].isna().sum())}")
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Build commune_zones.csv from CATNAT workbook.")
    parser.add_argument(
        "--input",
        default=str(Path(__file__).resolve().parent / "CATNAT_2023_2025.xlsx"),
        help="Path to CATNAT workbook",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help="Path to output commune_zones.csv",
    )
    args = parser.parse_args()

    from prepare_portfolio import load_and_clean_portfolio

    portfolio = load_and_clean_portfolio([args.input])
    build_lookup_table(portfolio, output_path=args.output)


if __name__ == "__main__":
    main()
