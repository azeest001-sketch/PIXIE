"""
compare.py
----------
Looks for the same product on the other store.

A pasted Amazon link is searched on Flipkart, and a pasted Flipkart
link is searched on Amazon. A match is kept only when the titles
share enough of the same words. A weak match is ignored so PIXIE
does not compare two different products.
"""

# Small words that do not help tell products apart.
SKIP_WORDS = {
    "a", "an", "and", "for", "with", "the", "of", "to", "in", "on",
    "by", "pack", "set", "new", "buy",
}

# Feature words. They describe a lot of different products, so they
# make a store search return the wrong kind of item.
FILLER_WORDS = SKIP_WORDS | {
    "fully", "automatic", "lumens", "lumen", "support", "powered",
    "wifi", "bluetooth", "native", "portable", "wireless",
}

# The kind of product, kept in the search when the title says it.
PRODUCT_KINDS = (
    "projector", "earphones", "headphones", "earphone", "headphone",
    "keyboard", "mouse", "watch", "laptop", "phone",
)


def other_platform(platform: str) -> str:
    """Amazon searches Flipkart. Flipkart searches Amazon."""
    if platform == "amazon":
        return "flipkart"
    return "amazon"


def loose_words(title: str) -> list[str]:
    """
    Split a title into words.

    A hyphen is a space, so 48-Litre becomes 48 and Litre,
    and Marvel-33310 still contains the word Marvel.
    """
    text = (
        title.replace("|", " ")
        .replace(",", " ")
        .replace("-", " ")
        .replace("/", " ")
        .replace("+", " ")
    )
    words = []
    for word in text.split():
        clean = "".join(ch for ch in word if ch.isalnum())
        if clean:
            words.append(clean)
    return words


def same_word(word: str) -> str:
    """Liter and litre are the same word on the two stores."""
    lower = word.lower()
    if lower in {"liter", "liters", "litre", "litres"}:
        return "litre"
    return lower


def short_query(title: str) -> str:
    """
    The full store title is too long to search with.
    Keep the first six useful words, such as 'boAt Rockerz 113'.
    """
    words = []
    for clean in loose_words(title):
        # 12000 is a spec. 113 is a model number, so short numbers stay.
        if clean.isdigit() and len(clean) > 4:
            continue
        if len(clean) < 2 or clean.lower() in FILLER_WORDS:
            continue
        words.append(clean)
        if len(words) == 5:
            break
    lower_words = [word.lower() for word in words]
    title_lower = title.lower()
    for kind in PRODUCT_KINDS:
        if kind in title_lower and kind not in lower_words:
            words.append(kind)
            break
    return " ".join(words)


def useful_words(title: str) -> set[str]:
    """Lowercase words used to compare two titles."""
    words = set()
    for clean in loose_words(title):
        word = same_word(clean)
        if len(word) >= 2 and word not in SKIP_WORDS:
            words.add(word)
    return words


def compact_tokens(title: str) -> set[str]:
    """
    Words used for a match.

    'GM 60' is also stored as gm60, and '4 GB' as 4gb, so the two
    stores can spell a model in either way.
    """
    words = [same_word(word) for word in loose_words(title)]
    tokens = set(words)
    units = {"gb", "tb", "mb", "w", "mah", "hz", "mm"}
    for index, word in enumerate(words[:-1] if len(words) > 1 else []):
        nxt = words[index + 1]
        if word.isalpha() and nxt.isdigit():
            tokens.add(word + nxt)
        if word.isdigit() and nxt in units:
            tokens.add(word + nxt)
    return tokens


def keyword_tokens(title: str) -> set[str]:
    """The short search phrase, including a joined model such as gm60."""
    return compact_tokens(short_query(title))


def model_tokens(title: str) -> set[str]:
    """Tokens that contain a digit, such as gm60 or 4gb. These must agree."""
    return {token for token in keyword_tokens(title) if any(ch.isdigit() for ch in token)}


def title_score(original: str, candidate: str) -> float:
    """
    1.0 means every keyword we searched for appears in the result.
    The score uses the short search phrase, not the whole title,
    because store titles add a lot of extra words.
    """
    query_words = keyword_tokens(original)
    candidate_words = compact_tokens(candidate)
    if not query_words or not candidate_words:
        return 0
    shared = query_words & candidate_words
    return len(shared) / len(query_words)


def hit_title(hit: dict) -> str:
    """Search results use different key names on each store."""
    return (
        hit.get("title")
        or hit.get("product_title")
        or hit.get("name")
        or ""
    )


def hit_id(hit: dict) -> str:
    """The id we can pass back to get_product_data."""
    value = (
        hit.get("external_id")
        or hit.get("asin")
        or hit.get("itm_id")
        or hit.get("pid")
        or hit.get("unique_identifier")
        or hit.get("product_id")
    )
    return "" if value is None else str(value)


def model_numbers(title: str) -> set[str]:
    """Words that are only digits, such as 113. These separate similar models."""
    numbers = set()
    for word in short_query(title).split():
        if word.isdigit():
            numbers.add(word)
    return numbers


# Words a different model adds, such as Master Buds Max or Buds Pro.
MODEL_MARKERS = {"max", "plus", "pro", "ultra", "mini", "lite", "neo"}

# A single digit in front of one of these is a spec, not a new model.
# "6 Cooking Modes" is a spec. "Buds 2" is a different model.
SPEC_FOLLOW = {
    "mode", "modes", "mic", "mics", "heating", "cooking", "slice", "slices",
    "layer", "layers", "piece", "pieces", "hour", "hours", "hr", "hrs",
    "watt", "watts", "speed", "speeds", "setting", "settings",
}


def different_model(original: str, candidate: str) -> bool:
    """
    True when the search result is a different model.

    Master Buds 2 and Master Buds Max both contain the words
    'Noise Master Buds', so the word score cannot tell them apart.
    A marker word, or a single digit that is not a spec, means this
    result is the other model.
    """
    original_words = {word.lower() for word in loose_words(original)}
    words = [word.lower() for word in loose_words(candidate)]
    for index, word in enumerate(words):
        if word in original_words:
            continue
        if word in MODEL_MARKERS:
            return True
        if word.isdigit() and len(word) == 1:
            nxt = words[index + 1] if index + 1 < len(words) else ""
            if nxt in SPEC_FOLLOW:
                continue
            return True
    return False


def product_kind(title: str) -> str | None:
    """The first product type in a title, such as mouse before laptop."""
    kinds = sorted(PRODUCT_KINDS, key=len, reverse=True)
    for word in loose_words(title):
        lower = word.lower()
        for kind in kinds:
            if lower == kind:
                return kind
    return None


def best_match(original_title: str, hits: list) -> dict | None:
    """
    Pick a listing only when the keywords agree.

    The model token, such as GM60, has to be in the other title.
    A mouse is not matched to a keyboard. If nothing is that close,
    nothing is saved.
    """
    original_kind = product_kind(original_title)
    required_models = model_tokens(original_title)
    scored = []
    for hit in hits[:12]:
        if not isinstance(hit, dict):
            continue
        title = hit_title(hit)
        if not title or not hit_id(hit):
            continue
        candidate_kind = product_kind(title)
        if original_kind and candidate_kind and candidate_kind != original_kind:
            continue
        candidate_tokens = compact_tokens(title)
        if required_models and not required_models <= candidate_tokens:
            continue
        score = title_score(original_title, title)
        # One missing descriptive word can pass. A random shared brand cannot.
        if score < 0.8:
            continue
        scored.append((score, hit))

    if not scored:
        return None

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


def price_note(source: dict, other: dict) -> str:
    """One sentence saying which store is cheaper right now."""
    missing = [
        (item.get("platform") or "store").title()
        for item in (source, other)
        if item.get("price_available") is False or item.get("price") is None
    ]
    if missing:
        return "Price is not available on " + " and ".join(missing) + "."
    gap = round(float(source["price"]) - float(other["price"]), 2)
    if gap > 0:
        return f"{other['platform'].title()} is ₹{abs(gap):,.0f} cheaper"
    if gap < 0:
        return f"{source['platform'].title()} is ₹{abs(gap):,.0f} cheaper"
    return "Both stores show the same price"
