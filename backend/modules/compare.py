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
    "watch", "laptop", "phone",
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


def title_score(original: str, candidate: str) -> float:
    """
    1.0 means every word we searched for appears in the result.
    The score uses the short search phrase, not the whole title,
    because store titles add a lot of extra words.
    """
    query_words = {same_word(word) for word in short_query(original).split()}
    candidate_words = useful_words(candidate)
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


def best_match(original_title: str, hits: list) -> dict | None:
    """
    Pick the closest search result.

    The listing that shares the most words wins. When two listings
    are equally close, the first one from the store search is kept.
    A near match is saved instead of being left blank.
    """
    scored = []
    for hit in hits[:12]:
        if not isinstance(hit, dict):
            continue
        title = hit_title(hit)
        if not title or not hit_id(hit):
            continue
        scored.append((title_score(original_title, title), hit))

    if not scored:
        return None

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


def price_note(source: dict, other: dict) -> str:
    """One sentence saying which store is cheaper right now."""
    gap = round(float(source["price"]) - float(other["price"]), 2)
    if gap > 0:
        return f"{other['platform'].title()} is ₹{abs(gap):,.0f} cheaper"
    if gap < 0:
        return f"{source['platform'].title()} is ₹{abs(gap):,.0f} cheaper"
    return "Both stores show the same price"
