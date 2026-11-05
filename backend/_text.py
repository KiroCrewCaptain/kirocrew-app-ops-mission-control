"""Grapheme-safe cut point for the notification clip.

Restated from Kiro Crew's ``imessage/plaintext.py`` (``_grapheme_boundary`` and
``_joins_previous``), a private helper with no App Kit seam. Pure and policy-free:
it only decides where a string may be cut without splitting a user-perceived
character, so a copy cannot weaken anything the host enforces.
"""

from __future__ import annotations

import unicodedata

#: Characters that must never be separated from what precedes them.
_ZWJ = "\u200d"
_VARIATION_SELECTORS = range(0xFE00, 0xFE10)
_VARIATION_SUPPLEMENT = range(0xE0100, 0xE01F0)
_SKIN_TONES = range(0x1F3FB, 0x1F400)
_REGIONAL_INDICATORS = range(0x1F1E6, 0x1F200)
_KEYCAP = 0x20E3
_TAG_RANGE = range(0xE0020, 0xE0080)

#: General categories that carry Grapheme_Extend. ``unicodedata.combining`` reports
#: the canonical combining CLASS, which is 0 for many real marks (Thai vowel signs,
#: Khmer, the Indic matras), so the CATEGORY is the property tested.
_MARK_CATEGORIES = frozenset({"Mn", "Mc", "Me"})


def grapheme_boundary(text: str, index: int) -> int:
    """Largest boundary <= ``index`` that does not split a grapheme cluster."""
    if index >= len(text):
        return len(text)
    while index > 0 and _joins_previous(text, index):
        index -= 1
    return index


def _joins_previous(text: str, index: int) -> bool:
    """True when cutting at ``index`` would break a grapheme cluster."""
    following = text[index]
    code = ord(following)
    if (
        following == _ZWJ
        or unicodedata.combining(following)
        or unicodedata.category(following) in _MARK_CATEGORIES
        or code in _VARIATION_SELECTORS
        or code in _VARIATION_SUPPLEMENT
        or code in _SKIN_TONES
        or code in _TAG_RANGE
        or code == _KEYCAP
    ):
        return True
    previous = text[index - 1]
    if previous == _ZWJ:
        return True
    # A flag is an EVEN-length run of regional indicators: only an even offset from
    # the run's start is a boundary.
    if code in _REGIONAL_INDICATORS and ord(previous) in _REGIONAL_INDICATORS:
        start = index - 1
        while start > 0 and ord(text[start - 1]) in _REGIONAL_INDICATORS:
            start -= 1
        return (index - start) % 2 == 1
    return False
