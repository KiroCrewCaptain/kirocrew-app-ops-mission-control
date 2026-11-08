import { ChatEmbed, activeLocale, fmtNumber, useAppApi, useImeGuard, useLanguageGeneration } from "@kirocrew/app-sdk";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Bell, BellOff, BellRing, BookOpen, CalendarClock, Check, CheckCircle2, CircleDot, ClipboardCopy, Clock, Eye, FileText, FolderGit2, GitBranch, Inbox, Info, KeyRound, MessageSquare, Radio, RefreshCw, ShieldAlert, ShieldCheck, Trash2, UserCheck, Users, Zap } from "lucide-react";
import * as ui from "@kirocrew/app-sdk/ui";
import { Badge, Btn, Card, CardTitle, EmptyState, ErrorNotice, Input, PageHeader, SegmentedControl, SendBtn, StatCard, Toggle } from "@kirocrew/app-sdk/ui";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/appApi.ts
var bound = null;
/** Called by the page root with `useAppApi()`. */
function bindAppApi(api) {
	bound = api;
}
function currentAppApi() {
	if (!bound) throw new Error("ops-mission-control: the host API is not bound yet");
	return bound;
}
// src/NativeSelect.tsx
/**
* The fallback for `Select` on a host that does not export one: a plain native
* `<select>` with the same props, so the call sites do not branch.
*/
function NativeSelect({ options, optionLabels, value, onChange, clearLabel, disabled, "aria-label": ariaLabel, title, className }) {
	const emptyRow = clearLabel !== void 0 || !options.includes(value);
	return /* @__PURE__ */ jsxs("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		disabled,
		"aria-label": ariaLabel,
		title,
		className: "text-sm px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]" + (className ? ` ${className}` : ""),
		children: [emptyRow && /* @__PURE__ */ jsx("option", {
			value: "",
			children: clearLabel ?? ""
		}), options.map((option, index) => /* @__PURE__ */ jsx("option", {
			value: option,
			children: optionLabels?.[index] ?? option
		}, option))]
	});
}
// src/hostSdk.ts
/**
* Host names added at App Kit level 1, feature-detected.
*
* A named import of an export the host's module does not have fails the whole
* bundle at link time, so a host older than these seams would show a broken page
* instead of a slightly plainer one. These names are therefore read off namespace
* imports, each through an `in` check, and each has a local fallback. Names every
* supported host has are named-imported where they are used.
*/
/** The host's inline dropdown, or a native `<select>` on a host without one. */
var Select = ("Select" in ui ? ui.Select : void 0) ?? NativeSelect;
// src/i18n.ts
/**
* The app's own strings. A bundle cannot read the dashboard's catalogs (those
* belong to the host and change with it), so every locale the dashboard ships is
* bundled here and looked up against the host's active language.
*
* The catalogs (`ui/i18n/<locale>.json`) are the `apps.autoResearch.*` subtree
* copied from Kiro Crew's dashboard catalogs (for English, its generated and
* hand-authored catalogs merged), under the SAME key paths, so every call site
* reads as it did in the built-in.
*
* Lookup order: the exact locale (`pt`, `zh-CN`), then its base language, then
* English, then the key itself. A numeric `count` selects the plural form the
* locale's rules name (`_one`, `_few`, `_many`, `_other`), as the dashboard's own
* catalogs are keyed. `{{name}}` placeholders are filled from `vars`; one with no
* value is left as written.
*
* `t` reads the language at call time. The root component subscribes to the
* host's language changes (`useLanguageGeneration`), and its re-render reaches
* every child, so a language switch repaints the page without a reload.
*/
var CATALOGS = {
	bn: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"ব্যাক-অফ করছে\",\"source_health_failed\":\"ব্যর্থ\",\"source_health_not_polled_yet\":\"এখনও পোল করা হয়নি\",\"source_health_not_set_up\":\"সেট আপ করা নেই\",\"the_last_poll_failed\":\"শেষ পোলটি ব্যর্থ হয়েছে।\",\"verification_confirmed_label\":\"নিশ্চিত\",\"verification_confirmed_meaning\":\"{{verb}}-এর পরে উত্তর দিয়েছে এমন একটি সোর্স থেকে আমরা সিগন্যালটি আবার পড়েছি, আর সেটি এখন আর ফায়ার করছে না।\",\"verification_could_not_check_label\":\"যাচাই করা যায়নি\",\"verification_could_not_check_meaning\":\"আবার যাচাই করার সময় হয়েছিল, কিন্তু সোর্স উত্তর দেয়নি, তাই এতে কোনো দিকেই কিছু প্রমাণ হয় না। পরের কোনো সাইকেল নিজে থেকেই আবার চেষ্টা করবে।\",\"verification_not_checkable_label\":\"পাঠানো হয়েছে, নিশ্চিত হয়নি\",\"verification_not_checkable_meaning\":\"{{verb}} গ্রহণ করা হয়েছে, কিন্তু তা কাজে লেগেছে কি না এই অ্যাপ দেখতে পারে না — নকশা অনুযায়ীই অ্যাকনলেজমেন্টের পরেও অ্যালার্ট ফায়ার করতে থাকে, তাই অ্যালার্মের অবস্থা থেকে কোনো দিকেই কিছু বোঝা যায় না।\",\"verification_pending_label\":\"এখনও যাচাই করা হয়নি\",\"verification_pending_meaning\":\"{{verb}} সফল হয়েছে বলে জানিয়েছে, যার মানে শুধু এটাই যে প্রদানকারী অনুরোধটি গ্রহণ করেছে। এটি কাজে লেগেছে কি না জানতে পরের হার্টবিট সিগন্যালটি আবার পড়বে।\",\"verification_pending_meaning_at\":\"{{verb}} সফল হয়েছে বলে জানিয়েছে, যার মানে শুধু এটাই যে প্রদানকারী অনুরোধটি গ্রহণ করেছে। {{when}}-এর পরের হার্টবিট সিগন্যালটি আবার পড়ে দেখবে এটি কাজে লেগেছে কি না।\",\"verification_still_firing_label\":\"এই কাজের পরেও ফায়ার করছে\",\"verification_still_firing_meaning\":\"প্রদানকারী {{verb}} গ্রহণ করেছে, তবু আবার দেখার সময় সিগন্যালটি তখনও ফায়ার করছিল। যে অবস্থার জন্য এটি খোলা হয়েছিল সেটি এখনও চালু আছে।\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"একই সমস্যা দুবার মিলে গেলেই এখানে একটি প্যাটার্ন দেখা যায় — একবার ঘটলে সেটি একটি ইনসিডেন্ট, প্যাটার্ন নয়।\",\"applied_and_the_signal_kept_firing_afterwards\":\"প্রয়োগ করা হয়েছে, তারপরেও সিগন্যাল ফায়ার করে গেছে\",\"at_least_one_source_did_not_answer_the_last_poll\":\"শেষ পোলে অন্তত একটি সোর্স উত্তর দেয়নি।\",\"building_the_digest\":\"ডাইজেস্ট তৈরি হচ্ছে…\",\"claimed_by_hand\":\"হাতে করে নেওয়া\",\"claimed_by_hand_not_the_heartbeat\":\"হার্টবিট নয়, হাতে করে নেওয়া হয়েছে\",\"copied\":\"কপি হয়েছে\",\"copy_as_text\":\"টেক্সট হিসেবে কপি করো\",\"copy_the_digest_as_text_for_a_handover_thread\":\"হ্যান্ডওভার থ্রেডের জন্য ডাইজেস্টটি টেক্সট হিসেবে কপি করো\",\"coverage\":\"কভারেজ\",\"derived_from_configuration_only_no_source_has_be\":\"শুধু কনফিগারেশন থেকে বের করা — এই সেশনে কোনো সোর্স পোল করা হয়নি, তাই\\n              এদের কেউ উত্তর দেয় এটি তার প্রমাণ নয়। সিগন্যাল ট্যাব থেকে পোল করো।\",\"escalated_to_someone_else\":\"অন্য কারও কাছে এসকেলেট করা হয়েছে\",\"every_configured_source_answered_the_last_poll\":\"কনফিগার করা প্রতিটি সোর্স শেষ পোলে উত্তর দিয়েছে।\",\"failed\":\"ব্যর্থ\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"অন্য একজন মালিকের হাতে দেওয়া হয়েছে, তাই এটি আর এই অ্যাপের কাজ নয় — তবে পিছনে\\n            লেগে থাকার দায়িত্বটা তোমারই হতে পারে।\",\"handover\":\"হ্যান্ডওভার\",\"no_recurring_patterns_yet\":\"এখনও বারবার ঘটা কোনো প্যাটার্ন নেই\",\"not_configured_blind_spots\":\"কনফিগার করা নেই (অন্ধ জায়গা): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"কিছুই নজরে রাখা হচ্ছে না, তাই বোর্ড চুপচাপ থাকার কোনো মানে নেই। সেটিংস থেকে\\n              একটি সোর্স যুক্ত করো।\",\"pattern_proven\":\"প্রমাণিত\",\"refresh\":\"রিফ্রেশ\",\"refreshing\":\"রিফ্রেশ হচ্ছে…\",\"source_not_answering\":\"{{name}} (উত্তর দিচ্ছে না)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} শেষ পোলে উত্তর দেয়নি।\",\"stopped_with_no_diagnosis\":\"কোনো ডায়াগনোসিস ছাড়াই থেমে গেছে\",\"the_investigation_ended_without_recording_anythi\":\"অনুসন্ধানটি কিছু নথিভুক্ত না করেই শেষ হয়েছে, তাই ধরে এগোনোর মতো কোনো\\n            সূত্র নেই। এগুলোর উত্তর দেওয়ার বদলে আবার শুরু করা দরকার।\",\"these_do_not_progress_on_their_own_an_unanswered\":\"এগুলো নিজে থেকে এগোয় না — গত শিফটের উত্তরবিহীন কোনো প্রশ্নই এই শিফটের\\n            প্রথম কাজ।\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"এই ফিক্স প্রয়োগ করার পরেও সিগন্যাল ফায়ার করছিল। এটিকে সমাধান ধরে\\n                    হ্যান্ডওভার করো না — কী কী আগে চেষ্টা করা হয়েছে তা বলে দাও।\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"সেটি ঠিক না হওয়া পর্যন্ত বোর্ড চুপচাপ থাকা মানেই সব সেরে গেছে তার প্রমাণ নয়।\",\"waiting_on_you\":\"তোমার জন্য অপেক্ষা করছে\",\"watching_nothing\":\"নজরে রাখা হচ্ছে: কিছুই নয়\",\"watching_sources\":\"নজরে রাখা হচ্ছে: {{sources}}\",\"what_keeps_happening\":\"যা বারবার ঘটছে\"},\"incidentChat\":{\"ask_about_incident\":\"{{incidentId}} সম্পর্কে জিজ্ঞাসা করো…\",\"live_investigation_header\":\"{{incident}}{{title}}-এর লাইভ অনুসন্ধান। এজেন্টকে উত্তর দিতে বা পথ দেখাতে এখানেই জবাব দাও।\"},\"manifest\":{\"description\":\"নিজে থেকে কাজ করা একটি অন-কল ফার্স্ট রেসপন্ডার। তোমার অ্যালার্ম, পেজ ও মনিটরের ওপর নজর রাখে; যা ফায়ার করছে তা নিজের হাতে নেয়; আসল প্রেক্ষাপট নিয়ে সেটি অনুসন্ধান করে; আর একটি ফিক্স প্রস্তাব করে — যা যা শেখে সব একটি লোকাল লেজারে রাখা থাকে, তাই একই জিনিস দ্বিতীয়বার হলে প্রথমবারের চেয়ে দ্রুত মেটে।\",\"display_name\":\"Ops Mission Control\",\"use_case_1\":\"Operational signal দেখুন, incident তদন্ত করুন, প্রমাণিত fix আবার ব্যবহার করুন এবং সম্পূর্ণ local audit trail পরের পালার হাতে দিন।\",\"configuration_1\":\"Settings-এ environment credential বা provider token দিয়ে provider যোগ করুন, শুধু পড়ার জন্য Observe রাখুন এবং অনুমোদিত Propose বা Act action স্পষ্টভাবে বেছে নিন; Slack output বর্তমান Kiro Crew connection ব্যবহার করে।\",\"highlight_1\":\"ফায়ার করা কোনো অ্যালার্ম একটি হার্টবিটের মধ্যেই নিজের হাতে নেয়, আর কাউকে তাকাতে হওয়ার আগেই অনুসন্ধান শুরু করে\",\"highlight_2\":\"কনফিডেন্স ও ট্রাস্টের মাত্রাসহ একটি নলেজ লেজার — একই সমস্যা আবার হলে তুমি যা আগে থেকেই জানো তা থেকেই মেটে\",\"highlight_3\":\"ড্যাশবোর্ডে একটি লাইভ বোর্ড, আর উত্তর দেওয়া যায় এমন Slack থ্রেড হিসেবেও — তাই চ্যানেলটাই ড্যাশবোর্ড\",\"highlight_4\":\"AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues, বা সাইন করা JSON POST করতে পারে এমন যেকোনো সিস্টেমের সঙ্গে জুড়ে যায় — Alertmanager-আকারের বডিও চলে, প্রতি অ্যালার্টে একটি করে ইনসিডেন্ট বানিয়ে ছড়িয়ে দেওয়া হয়\",\"highlight_5\":\"ডিফল্টে শুধু-পঠন — লেখার কাজ প্রতি সিগন্যাল প্যাটার্ন ধরে আলাদা করে চালু করতে হয়, আর প্রতিটির অডিট রাখা হয়\",\"highlight_6\":\"রোটেশন বুঝে চলে: শিফটে থাকা অবস্থায় অটোমেশনের স্তর নিজে থেকেই সক্রিয় ও নিষ্ক্রিয় হয়\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"সম্পাদন\",\"active\":\"সক্রিয়\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — এই দুটি মান যে কেউ লিখে রাখতে পারে,\\n                                      তাই দ্রুত পথটির জন্য আরও দরকার\",\"approve_and_run\":\"অনুমোদন করে চালাও\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"শেষ পোলে অন্তত একটি সোর্স উত্তর দেয়নি, তাই সিগন্যাল না থাকা মানেই সব সেরে গেছে নয়।\",\"autonomous_first_responder_for_your_alarms_pages\":\"তোমার অ্যালার্ম, পেজ ও মনিটরের জন্য নিজে থেকে কাজ করা ফার্স্ট রেসপন্ডার\",\"awaiting_your_approval\":\"তোমার অনুমোদনের অপেক্ষায়\",\"board\":\"বোর্ড\",\"claiming\":\"হাতে নেওয়া হচ্ছে…\",\"closed_postmortems\":\"বন্ধ — পোস্টমর্টেম\",\"confidence\":\"কনফিডেন্স\",\"confidence_2\":\"কনফিডেন্স\",\"connect_a_provider_in_settings_to_start_watching\":\"নজরে রাখা শুরু করতে সেটিংস থেকে একটি প্রদানকারী যুক্ত করো।\",\"copied\":\"কপি হয়েছে\",\"copy_postmortem\":\"পোস্টমর্টেম কপি করো\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"টিকিট বা রিভিউয়ের জন্য পোস্টমর্টেমটি যেমন লেখা আছে ঠিক তেমনই কপি করো\",\"demoted\":\"নামিয়ে দেওয়া\",\"demoted_note\":\"নামিয়ে দেওয়া হয়েছে: এই ফিক্স প্রয়োগ করার পরেও সিগন্যাল ফায়ার করছিল{{recent}}। যে ফিক্স মাঝেমধ্যে কাজ করে সেটিও কিছু না থাকার চেয়ে ভালো, তাই এটি রেখে দেওয়া হয়েছে — তবে এটিকে সমাধান নয়, আগেই চেষ্টা করা হয়েছে এমন কিছু হিসেবে দেখো।\",\"demoted_refuted_summary_plural\":\"{{total}}টি এন্ট্রির মধ্যে {{demoted}}টি খণ্ডন হয়েছে — ফিক্স প্রয়োগ করার পরেও সিগন্যাল ফায়ার করে গেছে। উপরের {{rows}}টি সারির মধ্যে সবগুলো নাও থাকতে পারে।\",\"demoted_refuted_summary_singular\":\"{{total}}টি এন্ট্রির মধ্যে {{demoted}}টি খণ্ডন হয়েছে — ফিক্স প্রয়োগ করার পরেও সিগন্যাল ফায়ার করে গেছে। উপরের {{rows}}টি সারির মধ্যে সবগুলো নাও থাকতে পারে।\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"কাজের খসড়া করে জিজ্ঞাসা করে — অনুমোদন ছাড়া কিছুই চলে না\",\"empty_each_investigation_that_finds_a_reusable_f\":\"খালি। যে অনুসন্ধানে আবার কাজে লাগানো যায় এমন ফিক্স পাওয়া যায়, সেটি এখানেই লিখে রাখে, তাই\\n              একই সমস্যা আবার হলে তুমি যা আগে থেকেই জানো তা থেকেই মিটে যায়।\",\"every_configured_source_answered_the_last_poll_s\":\"কনফিগার করা প্রতিটি সোর্স শেষ পোলে উত্তর দিয়েছে, তাই এই চুপচাপ থাকাটা সত্যিকারের।\",\"executes_actions_granted_by_your_rules_every_one\":\"তোমার নিয়ম যে কাজের অনুমতি দেয় সেগুলো চালায় — প্রতিটির অডিট রাখা হয়\",\"expand_the_row_below_for_what_was_attempted_the\":\"কী কী চেষ্টা করা হয়েছে দেখতে নিচের সারিটি খোলো। উল্লেখ করা লেজার এন্ট্রিগুলোকে\\n                ব্যর্থ হিসেবে চিহ্নিত করা হয়েছে।\",\"expires_at_time\":\"{{time}}-এ মেয়াদ শেষ\",\"failed\":\"ব্যর্থ\",\"failed_2\":\"ব্যর্থ\",\"fast_path\":\"দ্রুত পথ\",\"fix_label\":\"ফিক্স: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"অনুমান — এজেন্টকে আগে নিশ্চিত করতে হবে\",\"is_no_longer_in_the_ledger\":\"আর\\n                                    লেজারে নেই।\",\"knowledge_ledger\":\"নলেজ লেজার\",\"known_patterns\":\"জানা প্যাটার্ন\",\"leader\":\"লিডার\",\"ledger_entry_locked\":\"লক করা\",\"ledger_entry_unlocked\":\"আনলক করা\",\"loading\":\"লোড হচ্ছে…\",\"mark_resolved\":\"সমাধান হয়েছে বলে চিহ্নিত করো\",\"marked_verified_and_high_confidence_but_used_onl\":\"যাচাই করা ও উচ্চ কনফিডেন্স হিসেবে চিহ্নিত, কিন্তু ব্যবহার হয়েছে মাত্র\",\"match_basis\":\"মিলের ভিত্তি\",\"match_basis_exact\":\"{{source}} এই সমস্যার জন্য একটি নির্দিষ্ট পরিচয় ({{key}}) প্রকাশ করে, আর লেজার আমাদের শেপ হ্যাশের বদলে সেটিকেই বেছে নেয়।\",\"matched_entry\":\"মিলে যাওয়া এন্ট্রি\",\"member_is_this_instance\":\"{{login}} (এই ইনস্ট্যান্স)\",\"mission_control\":\"Mission Control\",\"mode\":\"মোড\",\"n_matched\":\"{{count}}টি মিলেছে\",\"no_diagnosis_recorded_yet\":\"এখনও কোনো ডায়াগনোসিস লেখা হয়নি।\",\"no_github_login_resolved_for_this_instance_so_it\":\"এই ইনস্ট্যান্সের জন্য কোনো GitHub লগইন পাওয়া যায়নি, তাই এটি অন-কল আছে কি না\\n                বুঝতে পারছে না। schedule-file প্রদানকারীর github_login সেট করো, বা\\n                gh CLI-তে অথেন্টিকেট করো।\",\"no_incidents_claimed\":\"কোনো ইনসিডেন্ট হাতে নেওয়া হয়নি\",\"no_postmortem_was_written_for_this_incident_inci\":\"এই ইনসিডেন্টের জন্য কোনো পোস্টমর্টেম লেখা হয়নি। পোস্টমর্টেম লেখা শুরু হওয়ার\\n        আগেই যেগুলো বন্ধ হয়েছে সেগুলোর কোনো পোস্টমর্টেম নেই, আর কিছুই পরে সেগুলো ভরে দেয় না — নথিটা\\n        বানিয়ে লিখতে হত।\",\"no_providers_set_up_open_settings_to_connect_one\":\"এখনও কোনো প্রদানকারী সেট আপ করা নেই — একটি যুক্ত করতে সেটিংস খোলো।\",\"no_source_configured_nothing_polled_connect_one\":\"কোনো সোর্স কনফিগার করা নেই, তাই কিছুই পোল করা হয়নি। সেটিংস থেকে একটি প্রদানকারী যুক্ত করো।\",\"none_matched\":\"কিছুই মেলেনি\",\"not_on_roster_lenient\":\"এই ইনস্ট্যান্স ({{me}}) সময়সূচিতে নাম করে লেখা নেই। স্ট্রিক্ট গেটিং বন্ধ, তাই এটি তবুও কাজ হাতে নেয় — মানে এটি কোনো সহকর্মীর জন্য অপেক্ষা করে না। রোটেশনকেই সিদ্ধান্ত নিতে দিতে চাইলে একে কোনো who: তালিকায় যোগ করো।\",\"not_on_roster_strict\":\"এই ইনস্ট্যান্স ({{me}}) সময়সূচিতে নাম করে লেখা নেই, তাই স্ট্রিক্ট গেটিং চালু থাকলে এটি কখনও কাজ হাতে নেবে না। rotation.yaml-এর কোনো who: তালিকায় একে যোগ করো, বা সেটিংসে এর GitHub লগইন ঠিক করো।\",\"nothing_claimed_but_the_board_is_not_verified\":\"কিছুই হাতে নেওয়া হয়নি — তবে বোর্ড যাচাই করা নয়\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"এখনও কিছুই বন্ধ হয়নি। কোনো ইনসিডেন্ট সমাধান হলে বা এসকেলেট হলে তার পোস্টমর্টেম\\n          এখানে লেখা হয় — প্রতি ইনসিডেন্টে একটি Markdown ফাইল, যেটি টিকিটে জুড়ে দেওয়ার বা\\n          সহকর্মীর হাতে দেওয়ার উপযুক্ত রূপ।\",\"nothing_is_firing\":\"কিছুই ফায়ার করছে না\",\"observe\":\"পর্যবেক্ষণ\",\"off_shift\":\"শিফটে নেই\",\"off_shift_who_is_on_call\":\"শিফটে নেই — {{who}} অন-কল আছে{{until}}\",\"on_call_now\":\"এখন অন-কল\",\"on_call_team\":\"অন-কল টিম\",\"on_shift\":\"শিফটে আছে{{until}}\",\"on_shift_who\":\"শিফটে: {{who}}{{until}}\",\"open_in_provider\":\"প্রদানকারীতে খোলো\",\"pattern\":\"প্যাটার্ন\",\"patterns_known\":\"জানা প্যাটার্ন\",\"patterns_proven\":\"প্রমাণিত প্যাটার্ন\",\"poll_and_claim\":\"পোল করে হাতে নাও\",\"poll_every_configured_source_now_and_claim_anyth\":\"এখনই কনফিগার করা প্রতিটি সোর্স পোল করো, আর নতুন যা আসে হাতে নাও\",\"polled_summary_one\":\"{{polled}}টি ফায়ার করা সিগন্যাল পোল করা হয়েছে; হাতে নেওয়ার মতো নতুন কিছু নেই।\",\"polled_summary_other\":\"{{polled}}টি ফায়ার করা সিগন্যাল পোল করা হয়েছে; হাতে নেওয়ার মতো নতুন কিছু নেই।\",\"polled_summary_with_parked_one\":\"{{polled}}টি ফায়ার করা সিগন্যাল পোল করা হয়েছে, সঙ্গে প্রদানকারীর কাছে থামিয়ে রাখা {{suppressed}}টিকে ছোঁয়া হয়নি; হাতে নেওয়ার মতো নতুন কিছু নেই।\",\"polled_summary_with_parked_other\":\"{{polled}}টি ফায়ার করা সিগন্যাল পোল করা হয়েছে, সঙ্গে প্রদানকারীর কাছে থামিয়ে রাখা {{suppressed}}টিকে ছোঁয়া হয়নি; হাতে নেওয়ার মতো নতুন কিছু নেই।\",\"propose\":\"প্রস্তাব\",\"proven_agent_may_propose_directly\":\"প্রমাণিত — এজেন্ট সরাসরি প্রস্তাব দিতে পারে\",\"read_only_nothing_is_written_to_any_provider\":\"শুধু-পঠন — কোনো প্রদানকারীতে কিছুই লেখা হয় না\",\"reading_the_postmortem\":\"পোস্টমর্টেম পড়া হচ্ছে…\",\"reject\":\"প্রত্যাখ্যান\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Slack থ্রেডের জবাব এই অনুসন্ধান পর্যন্ত পৌঁছায়।\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Slack থ্রেডের জবাব এই অনুসন্ধান পর্যন্ত পৌঁছাবে না —\\n                              বদলে নিচের চ্যাটেই উত্তর দাও।\",\"resource\":\"রিসোর্স\",\"rotation_unknown_not_picking_up_work\":\"রোটেশন অজানা — কাজ হাতে নিচ্ছে না\",\"rotation_unknown_tier_armed\":\"রোটেশন অজানা — স্তর সক্রিয়\",\"runs_nightly_ledger_hygiene_for_the_team\":\"টিমের জন্য রোজ রাতে লেজার পরিষ্কার করার কাজ চালায়\",\"schedule_problem\":\"সময়সূচিতে সমস্যা: {{error}}\",\"sent\":\"পাঠানো হয়েছে\",\"sent_n_ago\":\"{{age}} আগে পাঠানো হয়েছে\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}}টি শিফট\",\"showing_closed_incidents_one\":\"বন্ধ হওয়া {{count}}টি ইনসিডেন্ট দেখানো হচ্ছে, সময়সীমা গত\",\"showing_closed_incidents_other\":\"বন্ধ হওয়া {{count}}টি ইনসিডেন্ট দেখানো হচ্ছে, সময়সীমা গত\",\"showing_n_of_total\":\"{{total}}টির মধ্যে {{shown}}টি — পুরোনোগুলো ডিস্কে আছে, তবে এই তালিকায় নেই\",\"source\":\"সোর্স\",\"source_health_not_verified_poll_from_signals_tab\":\"এই সেশনে সোর্সের অবস্থা যাচাই করা হয়নি — এই চুপচাপ থাকাটা সত্যি কি না নিশ্চিত হতে সিগন্যাল ট্যাব থেকে পোল করো।\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} শেষ পোলে উত্তর দেয়নি, তাই সিগন্যাল না থাকা মানেই সব সেরে গেছে নয়।\",\"sources_wired\":\"যুক্ত করা সোর্স\",\"status_dispatched\":\"ডিসপ্যাচ করা\",\"status_escalated\":\"এসকেলেট করা\",\"status_investigating\":\"অনুসন্ধান চলছে\",\"status_needs_human\":\"মানুষ দরকার\",\"status_resolved\":\"সমাধান হয়েছে\",\"status_stale\":\"পুরোনো\",\"status_unclaimed\":\"হাতে নেওয়া হয়নি\",\"tab_board\":\"বোর্ড\",\"tab_handover\":\"হ্যান্ডওভার\",\"tab_settings\":\"সেটিংস\",\"tab_signals\":\"সিগন্যাল\",\"the_decision_was_refused\":\"সিদ্ধান্তটি নাকচ করা হয়েছে।\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"এই ফিক্স প্রয়োগ করার পরেও সিগন্যাল ফায়ার করে গেছে\",\"this_provider_published_no_exact_identity_so_any\":\"এই প্রদানকারী কোনো নির্দিষ্ট পরিচয় প্রকাশ করেনি, তাই লেজারে যা মেলে\\n                                তা আমাদের শেপ হ্যাশ — এমন একটি হিউরিস্টিক যা শুধু সংখ্যায়\\n                                আলাদা অ্যালার্মগুলোকে এক করে ফেলে, যেমন একই রিসোর্সের 4xx আর\\n                                5xx হার। মনে রাখা কোনো ফিক্সকে সেই বুঝেই ওজন করো।\",\"through_sink\":\"{{sink}} দিয়ে\",\"through_sink_for_duration\":\"{{duration}} ধরে {{sink}} দিয়ে\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · শুধু অন-কল ইনস্ট্যান্সই কাজ হাতে নেয়\",\"trust\":\"ট্রাস্ট\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"আনলক করা\\\" মানে কোনো অনুসন্ধান নতুন করে বের না করে সরাসরি এই ফিক্সটাই\\n              প্রস্তাব করতে পারে — আর তার জন্য চারটি শর্তই দরকার: যাচাই করা ট্রাস্ট, উচ্চ\\n              কনফিডেন্স, অন্তত\",\"until_shift_end\":\"{{end}} পর্যন্ত\",\"used\":\"ব্যবহৃত\",\"used_2\":\"ব্যবহৃত\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"বার ব্যবহার, আর কোনো নথিভুক্ত ব্যর্থতা না থাকা।\\n              লক করা এন্ট্রিও এজেন্টকে পুরোটাই দেওয়া হয়; তাকে শুধু আগে সেটি নিশ্চিত করতে\\n              বলা হয়। নামিয়ে দেওয়া এন্ট্রি চেষ্টা করা হয়েছিল আর তারপরেও সিগন্যাল ফায়ার করে গেছে,\\n              যা না-পরীক্ষা করা অনুমানের চেয়ে অনেক বড় সতর্কবার্তা।\",\"uses_before_an_agent_proposes_it_without_checkin\":\"বার ব্যবহারের পরেই কোনো এজেন্ট\\n                                      যাচাই না করে এটি প্রস্তাব করে।\",\"verification_failed_many\":\"এই অ্যাপ যে কাজগুলো প্রয়োগ হয়েছে বলে জানিয়েছিল, তারপরে আবার পড়ার সময় {{count}}টি ইনসিডেন্ট তখনও ফায়ার করছিল ({{ids}})।\",\"verification_failed_one\":\"এই অ্যাপ যে কাজটি প্রয়োগ হয়েছে বলে জানিয়েছিল, তারপরে আবার পড়ার সময় {{id}} তখনও ফায়ার করছিল।\",\"waiting_awaiting_approval\":\"চালিয়ে যেতে অনুমোদন করো\",\"waiting_awaiting_diagnosis\":\"থেমে গেছে, কোনো ডায়াগনোসিস নেই\",\"waiting_awaiting_input\":\"তোমার জন্য অপেক্ষা করছে\",\"waiting_on_you\":\"তোমার জন্য অপেক্ষা করছে\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"একটি প্যাটার্ন দিতে হবে — সবকিছুর জন্য একসঙ্গে অনুমতি দেওয়ার উপায় নেই। প্রিফিক্স মেলাতে * ব্যবহার করো, যেমন prod-* দিলে যেসব রিসোর্সের নাম prod- দিয়ে শুরু হয় সবই ধরা পড়ে।\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act-এর জন্য উপরের মোড আর সিগন্যালের সঙ্গে মেলে এমন একটি নিয়ম — দুটোই দরকার। শুধু মোড দিয়ে কোনো অনুমতি আসে না।\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act শুধু সেই সিগন্যালগুলোর জন্যই কাজ করে যেগুলো তোমার লেখা কোনো নিয়মের সঙ্গে মেলে। কোনো\\n              নিয়ম না থাকলে এটি Propose-এর মতোই চলে।\",\"act_rules\":\"Act নিয়ম\",\"active\":\"সক্রিয়\",\"all_actions\":\"সব কাজ\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"তোমার জন্য অপেক্ষা করা ইনসিডেন্ট বেশি সময় পায় — ঘুমিয়ে থাকা আর এজেন্ট ক্র্যাশ করা\\n        এক জিনিস নয়।\",\"autonomy\":\"অটোনমি\",\"branch\":\"ব্রাঞ্চ\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"চ্যানেল ID\",\"channel_when_incident_released\":\"কোনো নিষ্ক্রিয় অনুসন্ধান আবার হাতে নেওয়ার জন্য ছেড়ে দেওয়া হলে এটি চলে।\",\"channel_when_source_health\":\"যে পোলে কোনো সোর্স উত্তর দেওয়া বন্ধ করে সেই পোলেই এটি চলে — যতক্ষণ সেটি বন্ধ থাকে ততক্ষণ আর নয়।\",\"channel_when_waiting_on_you\":\"কোনো ইনসিডেন্ট কোনো মানুষের জন্য অপেক্ষা করতে শুরু করলেই এটি চলে।\",\"choose_a_source\":\"একটি সোর্স বেছে নাও\",\"cli\":\"CLI.\",\"companions_installed_one\":\"{{count}}টি অ্যাডাপ্টার প্যাকেজ ইনস্টল করা আছে: {{names}}। অনুমোদন পেলে এদের সোর্স উপরের তালিকায় দেখা যাবে; না দেখা গেলে ফ্লিট অ্যাডমিশন পলিসি সেগুলো নাকচ করেছে — গেটওয়ের লগ দেখে নাও।\",\"companions_installed_other\":\"{{count}}টি অ্যাডাপ্টার প্যাকেজ ইনস্টল করা আছে: {{names}}। অনুমোদন পেলে এদের সোর্স উপরের তালিকায় দেখা যাবে; না দেখা গেলে ফ্লিট অ্যাডমিশন পলিসি সেগুলো নাকচ করেছে — গেটওয়ের লগ দেখে নাও।\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"আগে একটি সিগন্যাল সোর্স যুক্ত করো — কনফিগার করা নেই এমন প্রদানকারীর নাম লেখা নিয়ম কখনও মিলবে না।\",\"credential_retention_note\":\"অ্যাপের ফোল্ডারের বাইরে রাখা, তাই এজেন্ট সেগুলো পড়তে পারে না। মনে রেখো: এই অ্যাপ আনইনস্টল করলেও সেগুলো মুছে যায় না। ক্রেডেনশিয়াল একেবারে সরাতে চাইলে আগে এখান থেকেই সেটি বাতিল করো।\",\"desktop_notifications\":\"ডেস্কটপ নোটিফিকেশন\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEAD ইচ্ছে করেই ছোঁয়া হয় না: আগে চলতি merge বা rebase শেষ করো বা বাতিল করো, কারণ তার নিচে ref সরালে ওই কাজ হারিয়ে যেতে পারে।\",\"enable_provider\":\"{{provider}} চালু করো\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"আদানপ্রদান শুধু রাতের মেইনটেন্যান্স পাসেই হয় — প্রতি ইনসিডেন্টে নয়। যে ইনস্ট্যান্সে\\n          \\\"রাতের লেজার মেইনটেন্যান্স\\\" চালু আছে সেখানেই এটি চলে (নিচের Instance\\n          দেখো), তাই যেটিতে সেটি বন্ধ সেটি কখনও pull করে না: তার কাছে আগে থেকেই যে কপি আছে তা\\n          দিয়েই কাজ চালায়, এর মধ্যে আছে\",\"expected_shape_label\":\"প্রত্যাশিত রূপ\",\"explicitly_every_time_what_does_not_work_is\":\"প্রতিবারই স্পষ্ট করে।\\n          যা কাজ করে না তা হল\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Slack-এ চ্যানেলের ডিটেল ডায়ালগের একেবারে নিচে এটি পাবে। আগে চ্যানেলে\\n            {{productName}} বটকে যোগ করো, নইলে পোস্ট করা ব্যর্থ হবে।\",\"get_a_notification_when_something_changes_that_n\":\"তোমাকে দরকার এমন কিছু বদলালেই নোটিফিকেশন পাও — কোনো Slack ওয়ার্কস্পেস বা\\n        কোনো রকম ক্রেডেনশিয়াল লাগে না। এটি {{productName}}-এর নোটিফিকেশন সেন্টারে আর\\n        তোমার ডেস্কটপে যায়।\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"{{whoKey}}-এ এই ইনস্ট্যান্স নিজেকে কীভাবে চিনবে। ফাঁকা রাখলে লোকাল {{ghCli}} CLI যে লগইনে অথেন্টিকেট করা আছে সেটিই ব্যবহার হবে।\",\"grant\":\"অনুমতি দাও\",\"heartbeat_pacing\":\"হার্টবিটের গতি\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"হার্টবিট একবারে কতটা কাজ হাতে নেয়, আর কাজ ফিরিয়ে দেওয়ার আগে কতক্ষণ অপেক্ষা\\n        করে। কোনো ইনসিডেন্ট ছেড়ে দেওয়া মানে সেটি সমাধান হওয়া নয় — সিগন্যালটি আবার হাতে\\n        নেওয়ার মতো হয়ে যায়, তাই যে অনুসন্ধানের এজেন্ট মরে গেছে সেটি অ্যালার্মকে চিরকাল আটকে\\n        না রেখে আবার চেষ্টা করা হয়।\",\"in_force_now\":\"এখন কার্যকর\",\"instance\":\"ইনস্ট্যান্স\",\"interrupts_by_default\":\"· ডিফল্টে বাধা দেয়\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"কোনো শিফটে নাম করে লেখা নেই, আর\\n                স্ট্রিক্ট গেটিং বন্ধ — তাই এই ইনস্ট্যান্স সময়সূচি যা-ই হোক কাজ হাতে নেয়, আর\\n                যে অন-কল আছে তার জন্য অপেক্ষা করে না। একে যোগ করো একটি\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"কোনো শিফটে নাম করে লেখা নেই, তাই\\n                স্ট্রিক্ট গেটিং চালু থাকলে এই ইনস্ট্যান্স কখনও কাজ হাতে নেবে না। একে যোগ করো একটি\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"রিপোতে\\n          হাতে করেই মিটিয়ে নেওয়া হয় — কনফ্লিক্ট মার্কারে ভরা সময়সূচি প্রকাশ করলে কোনো\\n          সহকর্মীই বুঝতে পারবে না কে অন-কল আছে।\",\"it_last_saw\":\"সে শেষ\\n          যা দেখেছিল সেই কপিও।\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Ops Mission Control শুধু তুমিই চালালে এটি চালু রেখে দাও। একই লেজার ভাগ করা\\n          টিমে ঠিক একটি ইনস্ট্যান্সই প্রাইমারি হওয়া উচিত, যাতে মেইনটেন্যান্স পাস প্রতিজনের\\n          জন্য আলাদা করে না চলে।\",\"ledger_conflict\":\"লেজার কনফ্লিক্ট\",\"ledger_intro\":\"তোমার টিমের নলেজ লেজার, সাধারণ একটি git রিপো দিয়ে আদানপ্রদান হয়: {{file}} রাতের মেইনটেন্যান্স পাস pull আর push করে।\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"তালিকায়, যদি চাও রোটেশনই\\n                ঠিক করুক কে সাড়া দেবে।\",\"list_or_correct_the_login_above\":\"তালিকায়, বা উপরের লগইনটি ঠিক করো।\",\"loading\":\"লোড হচ্ছে…\",\"main\":\"main\",\"min\":\"মিনিট\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"ইনসিডেন্টগুলো একটি চ্যানেলে লাইভ বোর্ড হিসেবে দেখাও: প্রতি ইনসিডেন্টে একটি মেসেজ, যার\\n        অবস্থা জায়গাতেই আপডেট হয়, আর ডায়াগনোসিস থাকে তার থ্রেডে। {{productName}}-এর কাছে\\n        আগে থেকেই যে Slack সংযোগ আছে সেটিই ব্যবহার করে — এই অ্যাপ নিজের কোনো Slack টোকেন রাখে না।\",\"mirror_incidents_to_slack\":\"ইনসিডেন্ট Slack-এ দেখাও\",\"mode_act_label\":\"সম্পাদন\",\"mode_help_act\":\"নিয়ম দিয়ে তুমি যে সিগন্যাল প্যাটার্নগুলোকে স্পষ্টভাবে অনুমোদিত তালিকায় রেখেছ, সেগুলোর জন্য কাজ চালায়। নিয়মে একটি সোর্স আর একটি রিসোর্স প্যাটার্নের নাম থাকতেই হবে — \\\"সবকিছু\\\" বলে কোনো নিয়ম নেই। প্রতিটি চালানোর অডিট রাখা হয়।\",\"mode_help_observe\":\"সিগন্যাল পড়ে আর অনুসন্ধান করে। কোনো প্রদানকারীতে কিছুই লেখে না। এটিই ডিফল্ট, আর শুরু করার নিরাপদ জায়গা।\",\"mode_help_propose\":\"Observe যা যা করে সব, তার সঙ্গে acknowledge / resolve / comment কাজের খসড়া করে আগে তোমাকে জিজ্ঞাসা করে। অনুমোদন ছাড়া কিছুই চলে না।\",\"mode_observe_label\":\"পর্যবেক্ষণ\",\"mode_propose_label\":\"প্রস্তাব\",\"needs_human_derived\":\"এখন {{value}}, উপরের উইন্ডো থেকে বের করা, তাই সেটি বদলালে এটিও বদলায়। এখানে সেট করলে এটি আটকে যায়।\",\"needs_human_pinned\":\"{{value}}-এ আটকে রাখা, উপরের উইন্ডোর সঙ্গে সম্পর্ক নেই।\",\"needs_setup\":\"সেট আপ করা দরকার\",\"new_claims_per_heartbeat\":\"প্রতি হার্টবিটে নতুন কতগুলো হাতে নেবে\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"পরের সিঙ্ক নিজেই এটি সরিয়ে নেবে, যদি না ওই নামের অন্য কোনো ব্রাঞ্চ আগে থেকেই থাকে — তখন কোন ইতিহাস রাখা হবে সেটি বেছে নেওয়ার বদলে এটি থেমে যায়, আর উপরের বার্তাটি কোন merge চালাতে হবে তার নাম বলে দেয়।\",\"no_branch_detached_head\":\"কোনো ব্রাঞ্চ নেই (detached HEAD)\",\"no_credential_note\":\"কোনো ক্রেডেনশিয়াল দিতে হয় না: সিঙ্ক তোমার হয়েই {{gitCmd}} চালায়, তোমার নিজের SSH কী বা ক্রেডেনশিয়াল হেল্পার দিয়ে। SSH রিমোট ({{sshRemote}}) ব্যবহার করাই ভালো — টোকেন বসানো কোনো URL কখনও পেস্ট করো না, কারণ এই অ্যাপের সেটিংস ফাইল সাইন ইন না করেও পড়া যায়। {{defaultBranch}}-এর জন্য ব্রাঞ্চ ফাঁকা রাখো।\",\"no_github_login_resolved_for_this_instance_so_it\":\"এই ইনস্ট্যান্সের জন্য কোনো GitHub লগইন পাওয়া যায়নি, তাই এটি অন-কল আছে কি না\\n                বুঝতে পারছে না। উপরে একটি দাও, বা অথেন্টিকেট করো\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"এখনও কোনো নিয়ম নেই — নির্দিষ্ট কিছু রিসোর্সের জন্য অনুমতি দিতে নিচে একটি যোগ করো।\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"এই গেটওয়ে এটি জানায় না, তাই এখন কোন মানগুলো কার্যকর তা দেখানো যাচ্ছে না।\",\"not_set\":\"সেট করা নেই\",\"not_set_up\":\"সেট আপ করা নেই\",\"notify_me_on_state_changes\":\"অবস্থা বদলালে আমাকে জানাও\",\"off\":\"বন্ধ\",\"on_call_schedule\":\"অন-কল সময়সূচি\",\"one_notification_per_state_change_never_per_hear\":\"প্রতি অবস্থা বদলে একটি নোটিফিকেশন, কখনও প্রতি হার্টবিটে নয়: যে সোর্স বন্ধ হয়ে থাকে\\n        তার কথা একবারই জানানো হয়, প্রতি দুই মিনিটে নয়। একই ইনসিডেন্টের বারবারগুলো এক\\n        সারিতেই জমা হয়।\",\"only_the_on_call_instance_picks_up_work\":\"শুধু অন-কল ইনস্ট্যান্সই কাজ হাতে নেয়\",\"pagerduty_user_id_help\":\"PagerDuty কাকে অন-কল বলে জানায় তার সঙ্গে মিলিয়ে দেখা হয়, যাতে এই ইনস্ট্যান্স বুঝতে পারে পেজারটি তোমার কি না। এজেন্ট যেখানে পৌঁছাতে পারে না সেখানে রাখা — ফাঁকা রাখলে সময়সূচিতে থাকা যে কাউকেই তুমি ধরে নেওয়া হবে।\",\"incidentio_user_id_help\":\"তোমার incident.io সময়সূচিতে থাকা ইউজারদের সঙ্গে মিলিয়ে দেখা হয়, যাতে এই ইনস্ট্যান্স বুঝতে পারে শিফটটি তোমার কি না। এজেন্ট যেখানে পৌঁছাতে পারে না সেখানে রাখা — ফাঁকা রাখলে সময়সূচিতে থাকা যে কাউকেই তুমি ধরে নেওয়া হবে। ID সেট থাকলেও কোনো সময়সূচি কনফিগার করা না থাকলে, এই ইনস্ট্যান্স শিফটের বাইরেই থাকে।\",\"identity_save_refused\":\"তোমার ID সংরক্ষণ হয়নি — সেটিংস স্টোর লেখাটি প্রত্যাখ্যান করেছে। আবার চেষ্টা করো।\",\"change_save_refused\":\"তোমার পরিবর্তন সংরক্ষণ হয়নি — সেটিংস স্টোর লেখাটি প্রত্যাখ্যান করেছে। আবার চেষ্টা করো।\",\"value_too_long_refused\":\"মানটি খুব দীর্ঘ, তাই এটি সংরক্ষণ করা হয়নি।\",\"prod_star\":\"prod-*\",\"providers\":\"প্রদানকারী\",\"pushes_stay_refused_until\":\"push আটকে থাকবে যতক্ষণ না\",\"quiet_and_expires_on_its_own\":\"· চুপচাপ, আর নিজে থেকেই মেয়াদ শেষ হয়\",\"ready\":\"প্রস্তুত\",\"release_a_question_after\":\"এত সময় পরে প্রশ্ন ছেড়ে দাও\",\"release_an_investigation_after\":\"এত সময় পরে অনুসন্ধান ছেড়ে দাও\",\"remote\":\"রিমোট\",\"replace\":\"বদলাও\",\"repository\":\"রিপোজিটরি\",\"resolved_from_the_gh_cli_when_blank\":\"ফাঁকা রাখলে gh CLI থেকে নেওয়া হয়\",\"resource_pattern\":\"রিসোর্স প্যাটার্ন\",\"revoke_rule\":\"নিয়ম বাতিল করো\",\"revoke_stored_credentials\":\"জমা রাখা ক্রেডেনশিয়াল বাতিল করো\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"লেজার ডিরেক্টরিতে হাতে করে চালাতে হবে,\\n          কারণ এই ব্রাঞ্চের কোনো upstream নেই।\",\"run_nightly_ledger_maintenance_on_this_instance\":\"এই ইনস্ট্যান্সে রাতের লেজার মেইনটেন্যান্স চালাও\",\"save\":\"সংরক্ষণ\",\"schedule_conflict\":\"সময়সূচিতে কনফ্লিক্ট\",\"schedule_location_note\":\"এখানে বেছে নেওয়ার মতো কোনো পাথ নেই: সময়সূচি হল একটি {{schedule}}, যা উপরের রিপোতে {{ledger}}-এর পাশে কমিট করা থাকে। জায়গাটা ইচ্ছে করেই বাঁধা, কারণ প্রতিটি ইনস্ট্যান্স যে রোটেশন পড়ে সেটিকে সেখানেই থাকতে হবে যেখানে প্রতিটি ইনস্ট্যান্স খোঁজে।\",\"share_the_knowledge_ledger_with_my_team\":\"আমার টিমের সঙ্গে নলেজ লেজার ভাগ করো\",\"shared_team_memory\":\"টিমের ভাগ করা মেমরি\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"উপরে ভাগ করে নেওয়া সেট আপ করা নেই, তাই এই মেশিনে যা আছে সেটিই সময়সূচি, আর সেটি\\n            আর কারও কাছে পৌঁছায় না।\",\"signal_source\":\"সিগন্যাল সোর্স\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"জমা রাখা আছে — বদলাতে নতুন একটি মান দাও\",\"strict_off_explanation\":\"তুমি অন-কল কি না সময়সূচি বলতে না পারলেও এই ইনস্ট্যান্স কাজ করে যায় — আর বাকি প্রতিটিও করে, তাই দুজন সহকর্মী একই অ্যালার্ট নিয়ে কাজ করে ফেলতে পারে। শুধু একা ব্যবহার করলেই এটি বেছে নাও।\",\"strict_on_explanation\":\"তুমি অন-কল কি না সময়সূচি বলতে না পারলে এই ইনস্ট্যান্স সরে দাঁড়ায়। এতেই ঠিক একজন সহকর্মীই কোনো অ্যালার্ট নিয়ে কাজ করে।\",\"syncing\":\"সিঙ্ক হচ্ছে\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"এই ইনস্ট্যান্স সবচেয়ে বেশি যা করতে পারে। প্রতি সিগন্যালের নিয়ম এটিকে ছোট করতে পারে, কখনও\\n          বড় নয় — তাই Observe-এ রেখে দিলে যত নিয়মই থাকুক, অ্যাপ শুধু-পঠনই থাকে।\",\"this_repo_is_on\":\"এই রিপো আছে\",\"to_silence_one_of_these_without_turning_the_rest\":\"বাকিগুলো বন্ধ না করে এর মধ্যে একটিকে চুপ করাতে — বা এটি কতটা জোরে বাধা দেবে\\n            তা বদলাতে — সেটিংস → নোটিফিকেশন ব্যবহার করো, সেখানে প্রতিটি অ্যাপ চ্যানেল\\n            তালিকাভুক্ত থাকে। কোনো চ্যানেল প্রথমবার চলার পরেই সেখানে দেখা যায়।\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"যে সিস্টেমগুলো নজরে রাখতে চাও সেগুলো চালু করো। AWS তোমার আগের ক্রেডেনশিয়ালই ব্যবহার\\n          করে — কোনো কী জমা রাখা হয় না। অন্য প্রদানকারীদের টোকেন এজেন্ট যেখানে পড়তে পারে না সেখানেই রাখা হয়।\",\"unavailable_here\":\"এখানে পাওয়া যায় না\",\"when_a_state_changes\":\"যখন কোনো অবস্থা বদলায়\",\"who\":\"who\",\"wrong_local_branch\":\"ভুল লোকাল ব্রাঞ্চ\",\"your_github_login\":\"তোমার GitHub লগইন\",\"your_pagerduty_user_id\":\"তোমার PagerDuty ইউজার ID\",\"your_incident_io_user_id\":\"তোমার incident.io ইউজার ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"তোমার টিমের লেজার এখনও আদানপ্রদান হচ্ছে — সিঙ্ক যে নাম বলছে সেটি হল\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"এই পোলে যে সিগন্যাল নেই, সেটিকে সেরে গেছে বলে ধরা যায়।\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"সবই আমাদের শেপ হ্যাশের ভিত্তিতে, যা শুধু সংখ্যায় আলাদা অ্যালার্মগুলোকে এক করে ফেলে। মনে রাখা ফিক্সকে সেই বুঝেই ওজন করো।\",\"at_least_one_source_did_not_answer_this_poll\":\"এই পোলে অন্তত একটি সোর্স উত্তর দেয়নি।\",\"claim\":\"হাতে নাও\",\"claimed\":\"হাতে নেওয়া\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· push দিয়ে আসে, তাই খালি পোলের কোনো মানে নেই\",\"every_configured_source_answered\":\"কনফিগার করা প্রতিটি সোর্স উত্তর দিয়েছে।\",\"everything_firing_already_has_an_incident\":\"এখন যা যা ফায়ার করছে সবগুলোর জন্যই আগে থেকে ইনসিডেন্ট আছে।\",\"firing\":\"ফায়ার করছে\",\"firing_not_yet_claimed\":\"ফায়ার করছে, এখনও হাতে নেওয়া হয়নি\",\"inbound_webhook_queued_one\":\"{{count}}টি ইনবাউন্ড webhook সিগন্যাল এসেছে আর পরের সাইকেলে হাতে নেওয়ার অপেক্ষায় আছে — সেটি এখনও বোর্ডে নেই।\",\"inbound_webhook_queued_other\":\"{{count}}টি ইনবাউন্ড webhook সিগন্যাল এসেছে আর পরের সাইকেলে হাতে নেওয়ার অপেক্ষায় আছে — সেগুলো এখনও বোর্ডে নেই।\",\"inhibited_by_alert_go_look_at_that_alert\":\"{{by}} এটিকে আটকে রেখেছে — উঁচু র‍্যাঙ্কের একটি অ্যালার্ট এটিকে ঢেকে রাখছে; ওই অ্যালার্টটাই দেখো।\",\"inhibited_by_another_alert_masking_this_one\":\"অন্য একটি অ্যালার্ট এটিকে আটকে রেখেছে — উঁচু র‍্যাঙ্কের একটি অ্যালার্ট এটিকে ঢেকে রাখছে।\",\"last_poll\":\"শেষ পোল\",\"loading\":\"লোড হচ্ছে…\",\"n_d_ago\":\"{{n}} দিন আগে\",\"n_h_ago\":\"{{n}} ঘণ্টা আগে\",\"n_ledger_entries_matched\":\"{{count}}টি লেজার এন্ট্রি মিলেছে — {{detail}}\",\"n_m_ago\":\"{{n}} মিনিট আগে\",\"n_on_own_identity_exact_match\":\"{{count}}টি এই প্রদানকারীর নিজের পরিচয়ের ভিত্তিতে, যা হুবহু মিল।\",\"n_s_ago\":\"{{n}} সেকেন্ড আগে\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}}টি সিগন্যাল\",\"n_similar_lessons_attached_a_near_miss_one\":\"প্রসঙ্গ হিসেবে {{count}}টি কাছাকাছি শিক্ষা জুড়ে দেওয়া হয়েছে — প্রায় মিল, হুবহু মিল নয়।\",\"n_similar_lessons_attached_a_near_miss_other\":\"প্রসঙ্গ হিসেবে {{count}}টি কাছাকাছি শিক্ষা জুড়ে দেওয়া হয়েছে — প্রায় মিল, হুবহু মিল নয়।\",\"no_attribution_cannot_say_who_parked_it\":\"এই প্রদানকারী কে করেছে তা জানায়নি, তাই কে এটি থামিয়ে রেখেছে বা কখন ফিরবে আমরা বলতে পারি না।\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"কোনো প্যাটার্ন দ্রুত পথের শর্ত পার করেনি, তাই এজেন্টকে প্রস্তাব দেওয়ার আগে নিশ্চিত করতে হবে।\",\"no_signal_source_is_configured_so_nothing_was_po\":\"কোনো সিগন্যাল সোর্স কনফিগার করা নেই, তাই কিছুই পোল করা হয়নি। এখন বোর্ড চুপচাপ\\n                থাকার কোনো মানে নেই — সেটিংস থেকে একটি সোর্স যুক্ত করো।\",\"no_signal_sources_registered\":\"কোনো সিগন্যাল সোর্স নিবন্ধন করা নেই।\",\"no_sources_reporting_a_firing_signal\":\"কোনো সোর্স ফায়ার করা সিগন্যালের খবর দিচ্ছে না।\",\"not_polled_yet_not_the_same_as_healthy\":\"এখনও পোল করা হয়নি — এর মানে সব ঠিক আছে নয়\",\"nothing_firing_but_parked_signals_not_investigated\":\"কিছুই ফায়ার করছে না, তবে উপরে থামিয়ে রাখা সিগন্যালগুলো নিয়ে কোনো অনুসন্ধান হচ্ছে না\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"কিছুই ফায়ার করছে না — তবে প্রদানকারীর কাছে {{count}}টি সিগন্যাল থামিয়ে রাখা আছে (উপরে দেখো) আর সেগুলো হাতে নেওয়া হবে না।\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"কিছুই ফায়ার করছে না — তবে প্রদানকারীর কাছে {{count}}টি সিগন্যাল থামিয়ে রাখা আছে (উপরে দেখো) আর সেগুলো হাতে নেওয়া হবে না।\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"লেজারে কিছুই মেলেনি, তাই অনুসন্ধান একেবারে শুরু থেকে হবে।\",\"nothing_unclaimed\":\"হাতে না নেওয়া কিছু নেই\",\"one_ledger_entry_matched\":\"1টি লেজার এন্ট্রি মিলেছে — {{detail}}\",\"parked\":\"থামিয়ে রাখা\",\"parked_2\":\"থামিয়ে রাখা\",\"parked_at_the_provider\":\"প্রদানকারীর কাছে থামিয়ে রাখা\",\"poll_answered\":\"উত্তর দিয়েছে\",\"poll_every_configured_source_now_read_only\":\"এখনই কনফিগার করা প্রতিটি সোর্স পোল করো (শুধু-পঠন)\",\"poll_now\":\"এখনই পোল করো\",\"poll_to_see_what_is_firing\":\"কী কী ফায়ার করছে দেখতে পোল করো।\",\"polling\":\"পোল করা হচ্ছে…\",\"proven_pattern_matched_agent_may_propose_directly\":\"একটি প্রমাণিত প্যাটার্ন মিলেছে, তাই এজেন্ট সরাসরি তার ফিক্সই প্রস্তাব করতে পারে।\",\"provider\":\"প্রদানকারী\",\"push_source_absence_note_one\":\"এই পোলে যে সিগন্যাল নেই তাকে সেরে গেছে বলে ধরা যায়, শুধু {{sources}} ছাড়া — এটি push দিয়ে এমন একটি স্পুলে পাঠায় যা প্রতিটি পোলে খালি হয়ে যায়, তাই একবার পৌঁছে যাওয়া সিগন্যাল আর দেখা যাবে না, সেটি এখনও ফায়ার করছে কি না তা নির্বিশেষে।\",\"push_source_absence_note_other\":\"এই পোলে যে সিগন্যাল নেই তাকে সেরে গেছে বলে ধরা যায়, শুধু {{sources}} ছাড়া — এরা push দিয়ে এমন একটি স্পুলে পাঠায় যা প্রতিটি পোলে খালি হয়ে যায়, তাই একবার পৌঁছে যাওয়া সিগন্যাল আর দেখা যাবে না, সেটি এখনও ফায়ার করছে কি না তা নির্বিশেষে।\",\"recovered\":\"সেরে গেছে\",\"reported_recovered\":\"সেরে গেছে বলে জানানো হয়েছে\",\"signal_sources\":\"সিগন্যাল সোর্স\",\"silenced_by_review_or_let_expire\":\"{{by}} এটিকে চুপ করিয়ে রেখেছে — দেখে নাও, বা প্রদানকারীর কাছেই চুপ থাকার মেয়াদ শেষ হতে দাও।\",\"someone_silenced_these_where_they_came_from_so_t\":\"এগুলো যেখান থেকে এসেছে সেখানেই কেউ চুপ করিয়ে দিয়েছে, তাই এগুলো নিয়ে কোনো অনুসন্ধান\\n            হচ্ছে না আর কোনো ইনসিডেন্টও খোলা হয়নি। এগুলো তালিকায় আছে কারণ \\\"কোনো মানুষ থামিয়ে রেখেছে\\\" আর\\n            \\\"অ্যাপ এটিকে পাত্তা দেয়নি\\\" নইলে হুবহু এক দেখাত।\",\"source\":\"সোর্স\",\"sources_did_not_answer_this_poll\":\"{{sources}} এই পোলে উত্তর দেয়নি।\",\"spool_full_note\":\"স্পুল {{limit}}-এ ভরে গেছে, তাই নতুন যা আসছে তার জন্য সবচেয়ে পুরোনোগুলো ফেলে দেওয়া হচ্ছে। বোর্ড থেকে একটি সাইকেল চালাও (\\\"পোল করে হাতে নাও\\\")।\",\"state\":\"অবস্থা\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"হার্টবিট প্রতি সাইকেলে অল্প কয়েকটাই হাতে নেয়, তাই একসঙ্গে অনেক এলে একটা লাইন জমে যায়।\\n          অপেক্ষা না করেই কোনো একটির অনুসন্ধান শুরু করতে সেটি এখনই হাতে নাও।\",\"the_provider_said_these_are_back_to_normal_unlik\":\"প্রদানকারী বলেছে এগুলো আবার স্বাভাবিক হয়ে গেছে। যে সিগন্যাল শুধু আর দেখা যাচ্ছে না তার\\n            চেয়ে এটি আলাদা — এটি এমন প্রমাণ যার ভিত্তিতে তুমি সমাধান করে দিতে পারো।\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"এই সোর্স এমন একটি স্পুলে push করে যা প্রতিটি পোলে খালি হয়ে যায়, তাই এটি যে সিগন্যাল একবার পাঠিয়েছে সেটি আর দেখা যাবে না, সমস্যাটি এখনও থাকলেও।\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"কাজ কোথা থেকে আসে। ক্রেডেনশিয়াল আর পরিধি সেটিংসে কনফিগার করো; কোনো সোর্স\\n          আসলে কী ফেরায় তা দেখতে এখানেই পোল করো।\",\"while_that_is_true_absence_of_a_signal_does_not\":\"সেটি সত্যি হলেও, সিগন্যাল না থাকা মানে সব সেরে গেছে নয় — হতে পারে আমরা শুধু\\n                দেখতেই পারিনি।\",\"firing_count_one\":\"{{count}}টি ফায়ার করছে ·\",\"firing_count_other\":\"{{count}}টি ফায়ার করছে ·\",\"parked_count_one\":\"{{count}}টি প্রদানকারীর কাছে থামিয়ে রাখা ·\",\"parked_count_other\":\"{{count}}টি প্রদানকারীর কাছে থামিয়ে রাখা ·\",\"cleared_count_one\":\"{{count}}টি মিটে গেছে ·\",\"cleared_count_other\":\"{{count}}টি মিটে গেছে ·\",\"unclaimed_count_one\":\"{{count}}টি এখনও হাতে নেওয়া হয়নি\",\"unclaimed_count_other\":\"{{count}}টি এখনও হাতে নেওয়া হয়নি\"}}}") },
	de: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"Ein autonomer Ersthelfer für den Betrieb. Er beobachtet deine Alarme, Pager-Meldungen und Überwachungen, übernimmt selbst, was auslöst, untersucht es mit echtem Kontext und schlägt eine Korrektur vor — und hält alles Gelernte in einem lokalen Register, damit der zweite Vorfall schneller geht als der erste.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Übernimmt einen auslösenden Alarm innerhalb eines Heartbeats und untersucht ihn, bevor jemand hinsehen muss\",\"highlight_2\":\"Wissensregister mit Konfidenz- und Vertrauensstufen — ein wiederkehrender Fehler wird aus dem gelöst, was du schon weißt\",\"highlight_3\":\"Live-Board im Dashboard und als Slack-Threads, auf die du antworten kannst, sodass der Kanal das Dashboard ist\",\"highlight_4\":\"Verbindet AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues oder jedes System, das signiertes JSON per POST senden kann — auch Nutzlasten im Alertmanager-Format, aufgefächert zu einem Vorfall pro Alarm\",\"highlight_5\":\"Standardmäßig schreibgeschützt — Schreibvorgänge werden pro Signalmuster einzeln freigegeben, und jeder wird protokolliert\",\"highlight_6\":\"Berücksichtigt die Rotation: Die Automatisierungsstufe für die aktive Schicht aktiviert und deaktiviert sich selbst\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Beobachte Betriebssignale, untersuche Vorfälle, verwende bewährte Korrekturen erneut und übergib einen vollständigen lokalen Audit-Trail.\",\"configuration_1\":\"Füge in den Einstellungen Anbieter mit Umgebungs-Zugangsdaten oder Anbieter-Token hinzu, behalte Observe für den Nur-Lese-Betrieb bei und erlaube zulässige Propose- oder Act-Aktionen ausdrücklich; die Slack-Ausgabe nutzt eine bestehende Kiro-Crew-Verbindung.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Du findest sie unten im Detaildialog des Kanals in Slack. Lade zuerst den {{productName}}-Bot in den Kanal ein, sonst schlägt das Posten fehl.\",\"get_a_notification_when_something_changes_that_n\":\"Erhalte eine Benachrichtigung, wenn sich etwas ändert, das deine Aufmerksamkeit braucht — ganz ohne Slack-Workspace und ohne jegliche Zugangsdaten. Sie landet im Benachrichtigungscenter von {{productName}} und auf deinem Desktop.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Spiegle Incidents als Live-Board in einen Kanal: eine Nachricht pro Incident, deren Status sich an Ort und Stelle aktualisiert, mit der Diagnose im Thread. Nutzt die Slack-Verbindung, die {{productName}} bereits hat — diese App speichert kein eigenes Slack-Token.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"Wird mit den Nutzern in deinem incident.io-Zeitplan abgeglichen, damit diese Instanz erkennt, ob die Schicht dir gehört. Wird dort gespeichert, wo der Agent nicht herankommt — leer lassen, dann wird jeder im Zeitplan als du behandelt. Ist eine ID gesetzt, aber kein Zeitplan konfiguriert, bleibt diese Instanz außer Schicht.\",\"identity_save_refused\":\"Deine ID wurde nicht gespeichert — der Einstellungsspeicher hat das Schreiben abgelehnt. Versuch es erneut.\",\"change_save_refused\":\"Deine Änderung wurde nicht gespeichert — der Einstellungsspeicher hat das Schreiben abgelehnt. Versuch es erneut.\",\"value_too_long_refused\":\"Dieser Wert ist zu lang und wurde daher nicht gespeichert.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} ausgelöst ·\",\"firing_count_other\":\"{{count}} ausgelöst ·\",\"parked_count_one\":\"{{count}} beim Anbieter zurückgestellt ·\",\"parked_count_other\":\"{{count}} beim Anbieter zurückgestellt ·\",\"cleared_count_one\":\"{{count}} behoben ·\",\"cleared_count_other\":\"{{count}} behoben ·\",\"unclaimed_count_one\":\"{{count}} noch nicht übernommen\",\"unclaimed_count_other\":\"{{count}} noch nicht übernommen\"}}}") },
	en: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"An autonomous ops first responder. Watches your alarms, pages, and monitors; claims what fires; investigates it with real context; and proposes a fix — keeping everything it learns in a local ledger so the second occurrence is faster than the first.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Claims a firing alarm within one heartbeat and investigates before anyone has to look\",\"highlight_2\":\"Knowledge ledger with confidence and trust levels — a repeat failure resolves from what you already know\",\"highlight_3\":\"Live board in the dashboard and as replyable Slack threads, so the channel is the dashboard\",\"highlight_4\":\"Connects AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues, or any system that can POST signed JSON — including Alertmanager-shaped bodies, fanned out one incident per alert\",\"highlight_5\":\"Read-only by default — write actions are opt-in per signal pattern, and every one is audited\",\"highlight_6\":\"Rotation-aware: the on-shift automation tier arms and disarms itself\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Watch operational signals, investigate incidents, reuse proven fixes, and hand over a complete local audit trail.\",\"configuration_1\":\"Add providers in Settings using environment credentials or provider tokens, keep Observe for read-only use, and explicitly opt into allowed Propose or Act actions; Slack output reuses an existing Kiro Crew connection.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Find it at the bottom of the channel's detail dialog in Slack. Invite the\\n            {{productName}} bot to the channel first, or posting will fail.\",\"get_a_notification_when_something_changes_that_n\":\"Get a notification when something changes that needs you — no Slack workspace and\\n        no credential of any kind. It goes to {{productName}}'s notification centre and to\\n        your desktop.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Mirror incidents to a channel as a live board: one message per incident whose\\n        state updates in place, with the diagnosis in its thread. Uses the Slack\\n        connection {{productName}} already has — this app stores no Slack token of its own.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"Matched against the users on your incident.io schedule, so this instance can tell whether the shift is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you. With an ID set but no schedules configured, this instance stays off shift.\",\"identity_save_refused\":\"Your ID was not saved — the settings store refused the write. Retry.\",\"change_save_refused\":\"Your change was not saved — the settings store refused the write. Retry.\",\"value_too_long_refused\":\"That value is too long, so it was not saved.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} firing ·\",\"firing_count_other\":\"{{count}} firing ·\",\"parked_count_one\":\"{{count}} parked at provider ·\",\"parked_count_other\":\"{{count}} parked at provider ·\",\"cleared_count_one\":\"{{count}} cleared ·\",\"cleared_count_other\":\"{{count}} cleared ·\",\"unclaimed_count_one\":\"{{count}} not yet claimed\",\"unclaimed_count_other\":\"{{count}} not yet claimed\"}}}") },
	es: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"Un primer respondedor autónomo para operaciones. Vigila tus alarmas, avisos de guardia y monitores; reclama lo que se dispara; lo investiga con contexto real; y propone una corrección — con todo lo que aprende guardado en un registro local para que la segunda vez sea más rápida que la primera.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Reclama en un solo heartbeat una alarma que se dispara, e investiga antes de que nadie tenga que mirar\",\"highlight_2\":\"Registro de conocimiento con niveles de certeza y de confianza — un fallo repetido se resuelve con lo que ya sabes\",\"highlight_3\":\"Tablero en vivo en el panel y como hilos de Slack a los que puedes responder, así el canal es el panel\",\"highlight_4\":\"Se conecta con AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues o cualquier sistema que pueda hacer POST de JSON firmado — incluidos los cuerpos con forma de Alertmanager, repartidos en un incidente por alerta\",\"highlight_5\":\"Solo lectura por defecto — las acciones de escritura se activan por patrón de señal, y cada una queda auditada\",\"highlight_6\":\"Tiene en cuenta la rotación: el nivel de automatización de guardia se activa y se desactiva por su cuenta\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Supervisa señales operativas, investiga incidentes, reutiliza correcciones probadas y entrega un registro de auditoría local completo.\",\"configuration_1\":\"Añade proveedores en Ajustes con credenciales de entorno o tokens, conserva Observe para el uso de solo lectura y habilita expresamente las acciones Propose o Act permitidas; la salida a Slack reutiliza una conexión de Kiro Crew existente.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_many\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_many\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_many\":\"{{count}} shifts\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_many\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_many\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Encuéntralo al final del diálogo de detalles del canal en Slack. Invita primero al bot de {{productName}} al canal o la publicación fallará.\",\"get_a_notification_when_something_changes_that_n\":\"Recibe una notificación cuando cambie algo que requiera tu atención — sin espacio de trabajo de Slack y sin credenciales de ningún tipo. Llega al centro de notificaciones de {{productName}} y a tu escritorio.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Refleja los incidentes en un canal como un panel en vivo: un mensaje por incidente cuyo estado se actualiza en el sitio, con el diagnóstico en su hilo. Usa la conexión de Slack que {{productName}} ya tiene — esta aplicación no guarda ningún token de Slack propio.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"Se compara con los usuarios de tu programación de incident.io, para que esta instancia pueda saber si el turno es tuyo. Se guarda donde el agente no puede llegar: déjalo en blanco para tratar a cualquiera de la programación como tú. Con un ID configurado pero sin programaciones, esta instancia se queda fuera de turno.\",\"identity_save_refused\":\"Tu ID no se guardó — el almacén de ajustes rechazó la escritura. Vuelve a intentarlo.\",\"change_save_refused\":\"Tu cambio no se guardó — el almacén de ajustes rechazó la escritura. Vuelve a intentarlo.\",\"value_too_long_refused\":\"Ese valor es demasiado largo, así que no se guardó.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_many\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_many\":\"{{count}} signals\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_many\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_many\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_many\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} activa ·\",\"firing_count_many\":\"{{count}} activas ·\",\"firing_count_other\":\"{{count}} activas ·\",\"parked_count_one\":\"{{count}} en pausa en el proveedor ·\",\"parked_count_many\":\"{{count}} en pausa en el proveedor ·\",\"parked_count_other\":\"{{count}} en pausa en el proveedor ·\",\"cleared_count_one\":\"{{count}} resuelta ·\",\"cleared_count_many\":\"{{count}} resueltas ·\",\"cleared_count_other\":\"{{count}} resueltas ·\",\"unclaimed_count_one\":\"{{count}} sin asignar todavía\",\"unclaimed_count_many\":\"{{count}} sin asignar todavía\",\"unclaimed_count_other\":\"{{count}} sin asignar todavía\"}}}") },
	fr: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"Un premier intervenant autonome pour l’exploitation. Il surveille tes alarmes, tes appels d’astreinte et tes moniteurs; prend en charge ce qui se déclenche; enquête avec un vrai contexte; et propose un correctif — en gardant tout ce qu’il apprend dans un registre local, pour que la deuxième occurrence aille plus vite que la première.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Prend en charge une alarme qui se déclenche en une seule pulsation et enquête avant que quiconque ait besoin d’y regarder\",\"highlight_2\":\"Registre de connaissances avec niveaux de confiance et de fiabilité — une panne récurrente se résout à partir de ce que tu sais déjà\",\"highlight_3\":\"Tableau en direct dans le tableau de bord et sous forme de fils Slack auxquels tu peux répondre, pour que le canal soit le tableau de bord\",\"highlight_4\":\"Se connecte à AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues ou à tout système capable d’envoyer du JSON signé en POST — y compris des corps au format Alertmanager, éclatés en un incident par alerte\",\"highlight_5\":\"En lecture seule par défaut — les actions d’écriture sont à activer explicitement pour chaque motif de signal, et chacune est auditée\",\"highlight_6\":\"Tient compte de la rotation d’astreinte: le niveau d’automatisation en service s’arme et se désarme de lui-même\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Surveille les signaux opérationnels, enquête sur les incidents, réutilise les correctifs éprouvés et transmets une piste d'audit locale complète.\",\"configuration_1\":\"Ajoute des fournisseurs dans les paramètres avec des identifiants d'environnement ou des jetons, conserve Observe pour un usage en lecture seule et autorise explicitement les actions Propose ou Act permises ; la sortie Slack réutilise une connexion Kiro Crew existante.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_many\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_many\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_many\":\"{{count}} shifts\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_many\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_many\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Tu le trouveras en bas de la boîte de dialogue des détails du canal dans Slack. Invite d’abord le bot {{productName}} dans le canal, sinon la publication échouera.\",\"get_a_notification_when_something_changes_that_n\":\"Reçois une notification quand un changement demande ton attention — sans espace de travail Slack ni identifiant d’aucune sorte. Elle arrive dans le centre de notifications de {{productName}} et sur ton bureau.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Reflète les incidents dans un canal sous forme de tableau en direct : un message par incident dont l’état se met à jour sur place, avec le diagnostic dans son fil. Utilise la connexion Slack que {{productName}} possède déjà — cette app ne stocke aucun jeton Slack qui lui soit propre.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"Comparé aux utilisateurs de ton planning incident.io, pour que cette instance puisse déterminer si le créneau est le tien. Stocké là où l'agent ne peut pas accéder — laisse vide pour traiter n'importe qui du planning comme toi. Avec un ID défini mais aucun planning configuré, cette instance reste hors de garde.\",\"identity_save_refused\":\"Ton ID n'a pas été enregistré — le magasin de réglages a refusé l'écriture. Réessaie.\",\"change_save_refused\":\"Ta modification n'a pas été enregistrée — le magasin de réglages a refusé l'écriture. Réessaie.\",\"value_too_long_refused\":\"Cette valeur est trop longue, elle n'a donc pas été enregistrée.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_many\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_many\":\"{{count}} signals\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_many\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_many\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_many\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} en alerte ·\",\"firing_count_many\":\"{{count}} en alerte ·\",\"firing_count_other\":\"{{count}} en alerte ·\",\"parked_count_one\":\"en attente chez le fournisseur : {{count}} ·\",\"parked_count_many\":\"en attente chez le fournisseur : {{count}} ·\",\"parked_count_other\":\"en attente chez le fournisseur : {{count}} ·\",\"cleared_count_one\":\"résolues : {{count}} ·\",\"cleared_count_many\":\"résolues : {{count}} ·\",\"cleared_count_other\":\"résolues : {{count}} ·\",\"unclaimed_count_one\":\"pas encore prises en charge : {{count}}\",\"unclaimed_count_many\":\"pas encore prises en charge : {{count}}\",\"unclaimed_count_other\":\"pas encore prises en charge : {{count}}\"}}}") },
	hi: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"बैक-ऑफ़ में\",\"source_health_failed\":\"फ़ेल\",\"source_health_not_polled_yet\":\"अभी पोल नहीं किया\",\"source_health_not_set_up\":\"सेट अप नहीं है\",\"the_last_poll_failed\":\"पिछला पोल फ़ेल हो गया।\",\"verification_confirmed_label\":\"पुष्ट\",\"verification_confirmed_meaning\":\"{{verb}} के बाद हमने जवाब देने वाले सोर्स से सिग्नल दोबारा पढ़ा, और वह अब नहीं भड़क रहा।\",\"verification_could_not_check_label\":\"जाँच नहीं हो सकी\",\"verification_could_not_check_meaning\":\"दोबारा जाँच का समय आ गया था और सोर्स ने जवाब नहीं दिया, इसलिए इससे किसी भी तरफ़ कुछ साबित नहीं होता। कोई बाद का साइकल इसे खुद फिर आज़माएगा।\",\"verification_not_checkable_label\":\"भेजा गया, पुष्ट नहीं\",\"verification_not_checkable_meaning\":\"{{verb}} स्वीकार हो गया, लेकिन यह ऐप देख नहीं सकता कि उसका असर हुआ या नहीं — एक्नॉलेजमेंट जान-बूझकर अलर्ट को भड़कता छोड़ देता है, इसलिए अलार्म की हालत से किसी भी तरफ़ कुछ पता नहीं चलता।\",\"verification_pending_label\":\"अभी जाँचा नहीं\",\"verification_pending_meaning\":\"{{verb}} ने सफलता लौटाई, जिसका मतलब सिर्फ़ यह है कि प्रोवाइडर ने रिक्वेस्ट स्वीकार कर ली। अगला हार्टबीट सिग्नल दोबारा पढ़कर पता करेगा कि असर हुआ या नहीं।\",\"verification_pending_meaning_at\":\"{{verb}} ने सफलता लौटाई, जिसका मतलब सिर्फ़ यह है कि प्रोवाइडर ने रिक्वेस्ट स्वीकार कर ली। {{when}} के बाद का अगला हार्टबीट सिग्नल दोबारा पढ़कर पता करेगा कि असर हुआ या नहीं।\",\"verification_still_firing_label\":\"इस कार्रवाई के बाद भी भड़क रहा है\",\"verification_still_firing_meaning\":\"प्रोवाइडर ने {{verb}} स्वीकार किया और जब हमने दोबारा देखा तो सिग्नल तब भी भड़क रहा था। जिस हालत के लिए यह खोला गया था वह चालू है।\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"पैटर्न यहाँ तब दिखता है जब वही फ़ेल्योर दो बार मैच कर चुका हो — एक बार होना इंसिडेंट है, पैटर्न नहीं।\",\"applied_and_the_signal_kept_firing_afterwards\":\"लागू किया, और उसके बाद भी सिग्नल भड़कता रहा\",\"at_least_one_source_did_not_answer_the_last_poll\":\"कम से कम एक सोर्स ने पिछले पोल का जवाब नहीं दिया।\",\"building_the_digest\":\"डाइजेस्ट बन रहा है…\",\"claimed_by_hand\":\"हाथ से उठाया\",\"claimed_by_hand_not_the_heartbeat\":\"हाथ से उठाया, हार्टबीट ने नहीं\",\"copied\":\"कॉपी हो गया\",\"copy_as_text\":\"टेक्स्ट के रूप में कॉपी करो\",\"copy_the_digest_as_text_for_a_handover_thread\":\"हैंडओवर थ्रेड के लिए डाइजेस्ट को टेक्स्ट के रूप में कॉपी करो\",\"coverage\":\"कवरेज\",\"derived_from_configuration_only_no_source_has_be\":\"सिर्फ़ कॉन्फ़िगरेशन से निकाला गया — इस सेशन में कोई सोर्स पोल नहीं हुआ, इसलिए\\n              यह सबूत नहीं है कि उनमें से कोई जवाब देता है। Signals टैब से पोल करो।\",\"escalated_to_someone_else\":\"किसी और को एस्केलेट किया\",\"every_configured_source_answered_the_last_poll\":\"हर कॉन्फ़िगर किए सोर्स ने पिछले पोल का जवाब दिया।\",\"failed\":\"फ़ेल\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"दूसरे ओनर को सौंपा गया, इसलिए अब यह इस ऐप का काम नहीं — लेकिन पीछे पड़ना\\n            तुम्हें ही पड़ सकता है।\",\"handover\":\"हैंडओवर\",\"no_recurring_patterns_yet\":\"अभी कोई दोहराने वाला पैटर्न नहीं\",\"not_configured_blind_spots\":\"कॉन्फ़िगर नहीं है (अनदेखे कोने): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"कुछ भी वॉच नहीं हो रहा, इसलिए शांत बोर्ड का कोई मतलब नहीं। Settings में कोई\\n              सोर्स जोड़ो।\",\"pattern_proven\":\"पुष्ट\",\"refresh\":\"ताज़ा करो\",\"refreshing\":\"ताज़ा हो रहा है…\",\"source_not_answering\":\"{{name}} (जवाब नहीं दे रहा)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} ने पिछले पोल का जवाब नहीं दिया।\",\"stopped_with_no_diagnosis\":\"बिना डायग्नोसिस रुक गया\",\"the_investigation_ended_without_recording_anythi\":\"जाँच कुछ भी रिकॉर्ड किए बिना ख़त्म हो गई, इसलिए उठाने लायक कोई थ्रेड नहीं\\n            है। इन्हें जवाब देने की जगह दोबारा शुरू करना होगा।\",\"these_do_not_progress_on_their_own_an_unanswered\":\"ये अपने आप आगे नहीं बढ़ते — पिछली शिफ़्ट का बिना जवाब वाला प्रॉम्प्ट\\n            इस शिफ़्ट का पहला काम है।\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"यह फ़िक्स लागू किया गया और उसके बाद भी सिग्नल भड़क रहा था। इसे जवाब\\n                    के तौर पर आगे मत सौंपो — बताओ कि क्या-क्या आज़मा चुके हो।\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"जब तक वह ठीक नहीं होता, शांत बोर्ड रिकवरी का सबूत नहीं है।\",\"waiting_on_you\":\"तुम्हारे इंतज़ार में\",\"watching_nothing\":\"वॉच में: कुछ नहीं\",\"watching_sources\":\"वॉच में: {{sources}}\",\"what_keeps_happening\":\"क्या बार-बार हो रहा है\"},\"incidentChat\":{\"ask_about_incident\":\"{{incidentId}} के बारे में पूछो…\",\"live_investigation_header\":\"{{incident}}{{title}} की लाइव जाँच। एजेंट को जवाब देने या उसे दिशा देने के लिए यहाँ रिप्लाई करो।\"},\"manifest\":{\"description\":\"ऑप्स का एक स्वायत्त फ़र्स्ट रेस्पॉन्डर। तुम्हारे अलार्म, पेजर अलर्ट और मॉनिटर पर नज़र रखता है; जो भड़के उसे खुद उठा लेता है; असली संदर्भ के साथ उसकी जाँच करता है; और एक फ़िक्स सुझाता है — जो कुछ सीखता है उसे लोकल लेजर में रखता जाता है, ताकि वही दिक्कत दूसरी बार पहली बार से जल्दी निपटे।\",\"display_name\":\"Ops Mission Control\",\"use_case_1\":\"संचालन संकेत देखें, घटनाओं की जाँच करें, प्रमाणित समाधान दोबारा उपयोग करें और पूरा लोकल audit trail अगली पाली को सौंपें।\",\"configuration_1\":\"Settings में environment credential या provider token से provider जोड़ें, केवल पढ़ने के लिए Observe रखें और अनुमत Propose या Act कार्रवाई साफ़ तौर पर चुनें; Slack आउटपुट मौजूदा Kiro Crew कनेक्शन का उपयोग करता है।\",\"highlight_1\":\"भड़कते अलार्म को एक हार्टबीट के भीतर उठा लेता है और किसी के देखने से पहले ही जाँच शुरू कर देता है\",\"highlight_2\":\"कॉन्फ़िडेंस और भरोसे के स्तरों वाला नॉलेज लेजर — दोबारा हुई गड़बड़ी उसी से हल हो जाती है जो तुम पहले से जानते हो\",\"highlight_3\":\"डैशबोर्ड में लाइव बोर्ड, और जवाब देने योग्य Slack थ्रेड के रूप में भी, इसलिए चैनल ही डैशबोर्ड है\",\"highlight_4\":\"AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues, या किसी भी ऐसे सिस्टम से जुड़ता है जो साइन किया हुआ JSON POST कर सके — इसमें Alertmanager जैसी बॉडी भी शामिल हैं, जो हर अलर्ट के लिए एक इंसिडेंट में बँट जाती हैं\",\"highlight_5\":\"डिफ़ॉल्ट रूप से रीड-ओनली — राइट कार्रवाइयाँ हर सिग्नल पैटर्न के लिए अलग से चालू करनी पड़ती हैं, और हर एक का ऑडिट होता है\",\"highlight_6\":\"रोटेशन का ध्यान रखता है: ऑन-शिफ़्ट ऑटोमेशन टियर खुद ही चालू और बंद होता रहता है\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"कार्रवाई\",\"active\":\"चालू\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — वे दोनों मान कोई भी दर्ज कर सकता है, इसलिए फ़ास्ट पाथ को\\n                                      कम से कम\",\"approve_and_run\":\"मंज़ूरी दो और चलाओ\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"पिछले पोल में कम से कम एक सोर्स ने जवाब नहीं दिया, इसलिए सिग्नल न दिखने का मतलब सुधार नहीं है।\",\"autonomous_first_responder_for_your_alarms_pages\":\"तुम्हारे अलार्म, पेजर अलर्ट और मॉनिटर के लिए स्वायत्त फ़र्स्ट रेस्पॉन्डर\",\"awaiting_your_approval\":\"तुम्हारी मंज़ूरी का इंतज़ार\",\"board\":\"बोर्ड\",\"claiming\":\"उठा रहे हैं…\",\"closed_postmortems\":\"बंद — पोस्टमॉर्टम\",\"confidence\":\"कॉन्फ़िडेंस\",\"confidence_2\":\"कॉन्फ़िडेंस\",\"connect_a_provider_in_settings_to_start_watching\":\"नज़र रखना शुरू करने के लिए Settings में कोई प्रोवाइडर कनेक्ट करो।\",\"copied\":\"कॉपी हो गया\",\"copy_postmortem\":\"पोस्टमॉर्टम कॉपी करो\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"पोस्टमॉर्टम को जैसा लिखा है ठीक वैसा ही कॉपी करो, किसी टिकट या समीक्षा के लिए\",\"demoted\":\"दर्जा घटाया\",\"demoted_note\":\"दर्जा घटाया: यह हल लागू किया गया था और उसके बाद भी सिग्नल भड़क रहा था{{recent}}। इसे रखा गया है क्योंकि कभी-कभी काम करने वाला हल कुछ न होने से बेहतर है, पर इसे जवाब मानने की जगह पहले-आज़माया हुआ मानो।\",\"demoted_refuted_summary_plural\":\"{{total}} में से {{demoted}} एंट्री गलत साबित हो चुकी हैं — हल लागू हुआ और सिग्नल भड़कता रहा। ज़रूरी नहीं कि वे सब ऊपर की {{rows}} पंक्तियों में हों।\",\"demoted_refuted_summary_singular\":\"{{total}} में से {{demoted}} एंट्री गलत साबित हो चुकी है — हल लागू हुआ और सिग्नल भड़कता रहा। ज़रूरी नहीं कि वे सब ऊपर की {{rows}} पंक्तियों में हों।\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"कार्रवाइयों का ड्राफ़्ट बनाता है और पूछता है — बिना मंज़ूरी कुछ नहीं चलता\",\"empty_each_investigation_that_finds_a_reusable_f\":\"खाली। जो जाँच दोबारा काम आने वाला हल ढूँढ लेती है वह उसे यहाँ दर्ज कर देती है, ताकि\\n              दोबारा हुई गड़बड़ी उसी से हल हो जाए जो तुम पहले से जानते हो।\",\"every_configured_source_answered_the_last_poll_s\":\"हर कॉन्फ़िगर किए सोर्स ने पिछले पोल का जवाब दिया, इसलिए यह शांति सच्ची है।\",\"executes_actions_granted_by_your_rules_every_one\":\"तुम्हारे नियम जो कार्रवाइयाँ देते हैं वही करता है — हर एक का ऑडिट होता है\",\"expand_the_row_below_for_what_was_attempted_the\":\"क्या-क्या आज़माया गया यह देखने के लिए नीचे की पंक्ति खोलो। जिन लेजर एंट्री का\\n                हवाला दिया गया है उन्हें नाकाम चिह्नित कर दिया गया है।\",\"expires_at_time\":\"{{time}} पर खत्म\",\"failed\":\"फ़ेल\",\"failed_2\":\"फ़ेल\",\"fast_path\":\"फ़ास्ट पाथ\",\"fix_label\":\"फ़िक्स: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"अनुमान — एजेंट को पहले पुष्टि करनी होगी\",\"is_no_longer_in_the_ledger\":\"अब\\n                                    लेजर में नहीं है।\",\"knowledge_ledger\":\"नॉलेज लेजर\",\"known_patterns\":\"ज्ञात पैटर्न\",\"leader\":\"लीडर\",\"ledger_entry_locked\":\"लॉक\",\"ledger_entry_unlocked\":\"अनलॉक\",\"loading\":\"लोड हो रहा है…\",\"mark_resolved\":\"सुलझा हुआ चिह्नित करो\",\"marked_verified_and_high_confidence_but_used_onl\":\"पुष्ट और हाई कॉन्फ़िडेंस चिह्नित, पर उपयोग सिर्फ़\",\"match_basis\":\"मैच का आधार\",\"match_basis_exact\":\"{{source}} इस गड़बड़ी की एक ठीक-ठीक पहचान ({{key}}) प्रकाशित करता है, जिसे लेजर हमारे शेप हैश से ऊपर रखता है।\",\"matched_entry\":\"मैच हुई एंट्री\",\"member_is_this_instance\":\"{{login}} (यही इंस्टेंस)\",\"mission_control\":\"Mission Control\",\"mode\":\"मोड\",\"n_matched\":\"{{count}} मैच\",\"no_diagnosis_recorded_yet\":\"अभी कोई निदान दर्ज नहीं हुआ।\",\"no_github_login_resolved_for_this_instance_so_it\":\"इस इंस्टेंस के लिए कोई GitHub लॉगिन तय नहीं हुआ, इसलिए यह बता नहीं सकता कि वह\\n                ऑन-कॉल है या नहीं। schedule-file प्रोवाइडर का github_login सेट करो, या\\n                gh CLI को प्रमाणित करो।\",\"no_incidents_claimed\":\"कोई इंसिडेंट नहीं उठाया गया\",\"no_postmortem_was_written_for_this_incident_inci\":\"इस इंसिडेंट के लिए कोई पोस्टमॉर्टम नहीं लिखा गया। जो इंसिडेंट पोस्टमॉर्टम लिखे जाने से\\n        पहले ही बंद हो गए उनके पास एक भी नहीं है, और कोई उन्हें पीछे से भरता भी नहीं — वह\\n        रिकॉर्ड गढ़ना पड़ता।\",\"no_providers_set_up_open_settings_to_connect_one\":\"अभी कोई प्रोवाइडर सेट अप नहीं है — कनेक्ट करने के लिए Settings खोलो।\",\"no_source_configured_nothing_polled_connect_one\":\"कोई सोर्स कॉन्फ़िगर नहीं है, इसलिए कुछ पोल नहीं हुआ। Settings में कोई प्रोवाइडर कनेक्ट करो।\",\"none_matched\":\"कोई मैच नहीं हुआ\",\"not_on_roster_lenient\":\"यह इंस्टेंस ({{me}}) शेड्यूल में नामित नहीं है। सख़्त गेटिंग बंद है, इसलिए यह फिर भी काम उठाता है — मतलब यह किसी साथी का इंतज़ार नहीं करता। अगर यह तय करना रोटेशन का काम है, तो इसे किसी who: सूची में जोड़ो।\",\"not_on_roster_strict\":\"यह इंस्टेंस ({{me}}) शेड्यूल में नामित नहीं है, इसलिए सख़्त गेटिंग में यह कभी काम नहीं उठाएगा। इसे rotation.yaml की किसी who: सूची में जोड़ो, या Settings में इसका GitHub लॉगिन ठीक करो।\",\"nothing_claimed_but_the_board_is_not_verified\":\"कुछ नहीं उठाया गया — पर बोर्ड की पुष्टि नहीं हुई\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"अभी कुछ बंद नहीं हुआ। जब कोई इंसिडेंट सुलझ जाता है या आगे बढ़ाया जाता है, तो उसका पोस्टमॉर्टम\\n          यहाँ लिखा जाता है — हर इंसिडेंट के लिए एक Markdown फ़ाइल, और यही रूप टिकट में लगाने या\\n          किसी साथी को देने लायक है।\",\"nothing_is_firing\":\"कुछ नहीं भड़क रहा\",\"observe\":\"निगरानी\",\"off_shift\":\"शिफ़्ट से बाहर\",\"off_shift_who_is_on_call\":\"शिफ़्ट से बाहर — {{who}} ऑन-कॉल है{{until}}\",\"on_call_now\":\"अभी ऑन-कॉल\",\"on_call_team\":\"ऑन-कॉल टीम\",\"on_shift\":\"शिफ़्ट पर{{until}}\",\"on_shift_who\":\"शिफ़्ट पर: {{who}}{{until}}\",\"open_in_provider\":\"प्रोवाइडर में खोलो\",\"pattern\":\"पैटर्न\",\"patterns_known\":\"ज्ञात पैटर्न\",\"patterns_proven\":\"पुष्ट पैटर्न\",\"poll_and_claim\":\"पोल करो और उठाओ\",\"poll_every_configured_source_now_and_claim_anyth\":\"हर कॉन्फ़िगर किए सोर्स को अभी पोल करो और जो नया मिले उसे उठा लो\",\"polled_summary_one\":\"{{polled}} भड़कता सिग्नल पोल किया; उठाने लायक कुछ नया नहीं।\",\"polled_summary_other\":\"{{polled}} भड़कते सिग्नल पोल किए; उठाने लायक कुछ नया नहीं।\",\"polled_summary_with_parked_one\":\"{{polled}} भड़कता सिग्नल पोल किया, और {{suppressed}} प्रोवाइडर पर रोका हुआ है जिसे छेड़ा नहीं गया; उठाने लायक कुछ नया नहीं।\",\"polled_summary_with_parked_other\":\"{{polled}} भड़कते सिग्नल पोल किए, और {{suppressed}} प्रोवाइडर पर रोके हुए हैं जिन्हें छेड़ा नहीं गया; उठाने लायक कुछ नया नहीं।\",\"propose\":\"प्रस्ताव\",\"proven_agent_may_propose_directly\":\"पुष्ट — एजेंट सीधे प्रस्ताव दे सकता है\",\"read_only_nothing_is_written_to_any_provider\":\"सिर्फ़ पढ़ना — किसी भी प्रोवाइडर में कुछ नहीं लिखा जाता\",\"reading_the_postmortem\":\"पोस्टमॉर्टम पढ़ा जा रहा है…\",\"reject\":\"ठुकराओ\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Slack थ्रेड में दिए गए जवाब इस जाँच तक पहुँचते हैं।\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Slack थ्रेड में दिए गए जवाब इस जाँच तक नहीं पहुँचेंगे —\\n                              इसके बजाय नीचे चैट में ही जवाब दो।\",\"resource\":\"रिसोर्स\",\"rotation_unknown_not_picking_up_work\":\"रोटेशन पता नहीं — काम नहीं उठा रहा\",\"rotation_unknown_tier_armed\":\"रोटेशन पता नहीं — टियर चालू है\",\"runs_nightly_ledger_hygiene_for_the_team\":\"टीम के लिए हर रात लेजर की सफ़ाई चलाता है\",\"schedule_problem\":\"शेड्यूल में दिक्कत: {{error}}\",\"sent\":\"भेजा गया\",\"sent_n_ago\":\"{{age}} पहले भेजा\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} शिफ़्ट\",\"showing_closed_incidents_one\":\"{{count}} बंद इंसिडेंट दिखा रहे हैं — सबसे हाल के\",\"showing_closed_incidents_other\":\"{{count}} बंद इंसिडेंट दिखा रहे हैं — सबसे हाल के\",\"showing_n_of_total\":\"{{total}} में से {{shown}} — पुराने डिस्क पर हैं पर इस सूची में नहीं\",\"source\":\"सोर्स\",\"source_health_not_verified_poll_from_signals_tab\":\"इस सत्र में सोर्स की सेहत परखी नहीं गई — शांति सच्ची है, यह पक्का करने के लिए Signals टैब से पोल करो।\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} ने पिछले पोल का जवाब नहीं दिया, इसलिए सिग्नल न दिखने का मतलब सुधार नहीं है।\",\"sources_wired\":\"जुड़े हुए सोर्स\",\"status_dispatched\":\"डिस्पैच किया\",\"status_escalated\":\"एस्केलेट किया\",\"status_investigating\":\"जाँच में\",\"status_needs_human\":\"इंसान चाहिए\",\"status_resolved\":\"सुलझा हुआ\",\"status_stale\":\"बासी\",\"status_unclaimed\":\"बिना उठाया\",\"tab_board\":\"बोर्ड\",\"tab_handover\":\"हैंडओवर\",\"tab_settings\":\"सेटिंग्स\",\"tab_signals\":\"सिग्नल\",\"the_decision_was_refused\":\"फ़ैसला ठुकरा दिया गया।\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"यह हल लागू किया गया और सिग्नल भड़कता रहा\",\"this_provider_published_no_exact_identity_so_any\":\"इस प्रोवाइडर ने कोई ठीक-ठीक पहचान प्रकाशित नहीं की, इसलिए लेजर का कोई भी मैच\\n                                हमारा शेप हैश ही है — एक ऐसी युक्ति जो सिर्फ़ किसी संख्या में\\n                                फ़र्क़ रखने वाले अलार्म को एक कर देती है, जैसे एक ही रिसोर्स पर\\n                                4xx और 5xx दर। याद रखे गए हल को इसी हिसाब से तोलो।\",\"through_sink\":\"{{sink}} के ज़रिए\",\"through_sink_for_duration\":\"{{sink}} के ज़रिए, {{duration}} तक\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · काम सिर्फ़ ऑन-कॉल इंस्टेंस उठाता है\",\"trust\":\"भरोसा\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"unlocked\\\" का मतलब है कि कोई जाँच इस हल को दोबारा निकालने की जगह सीधे\\n              प्रस्तावित कर सकती है — इसके लिए चारों चीज़ें चाहिए: पुष्ट भरोसा, हाई\\n              कॉन्फ़िडेंस, कम से कम\",\"until_shift_end\":\"{{end}} तक\",\"used\":\"उपयोग\",\"used_2\":\"उपयोग\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"उपयोग, और कोई दर्ज नाकामी नहीं।\\n              \\\"locked\\\" एंट्री भी एजेंट को पूरी दी जाती है; उसे पहले पुष्टि करने को कहा जाता है।\\n              घटे दर्जे की एंट्री आज़मा ली गई थी और सिग्नल भड़कता रहा, जो बिना आज़माए अनुमान से\\n              तगड़ी चेतावनी है।\",\"uses_before_an_agent_proposes_it_without_checkin\":\"उपयोग भी चाहिए, तभी कोई एजेंट बिना जाँचे उसे\\n                                      प्रस्तावित करता है।\",\"verification_failed_many\":\"इस ऐप ने जिन कार्रवाइयों को लागू बताया, उनके बाद दोबारा पढ़ने पर {{count}} इंसिडेंट तब भी भड़क रहे थे ({{ids}})।\",\"verification_failed_one\":\"इस ऐप ने जिस कार्रवाई को लागू बताया, उसके बाद दोबारा पढ़ने पर {{id}} तब भी भड़क रहा था।\",\"waiting_awaiting_approval\":\"आगे बढ़ने के लिए मंज़ूरी दो\",\"waiting_awaiting_diagnosis\":\"रुक गया, कोई निदान नहीं\",\"waiting_awaiting_input\":\"तुम पर अटका है\",\"waiting_on_you\":\"तुम पर अटका है\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"पैटर्न ज़रूरी है — कोई वाइल्डकार्ड छूट नहीं है। प्रीफ़िक्स मैच करने के लिए * इस्तेमाल करो, जैसे prod-* हर उस रिसोर्स को कवर करता है जिसका नाम prod- से शुरू होता है।\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act के लिए ऊपर का मोड और सिग्नल से मैच करने वाला नियम, दोनों चाहिए। अकेला मोड कुछ नहीं देता।\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act सिर्फ़ उन सिग्नल पर लागू होता है जिन पर तुम्हारा लिखा कोई नियम मैच करता है। कोई\\n              नियम न हो तो यह Propose की तरह ही चलता है।\",\"act_rules\":\"Act के नियम\",\"active\":\"चालू\",\"all_actions\":\"सभी कार्रवाइयाँ\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"जो इंसिडेंट तुम पर अटका है उसे लंबी अवधि मिलती है — सोए रहना और एजेंट का क्रैश हो\\n        जाना एक बात नहीं है।\",\"autonomy\":\"स्वायत्तता\",\"branch\":\"ब्रांच\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"चैनल ID\",\"channel_when_incident_released\":\"तब चलता है जब कोई ठहरी हुई जाँच दोबारा उठाने के लिए छोड़ दी जाती है।\",\"channel_when_source_health\":\"उस पोल पर चलता है जिस पर कोई सोर्स जवाब देना बंद कर देता है — जब तक वह बंद रहे, दोबारा नहीं।\",\"channel_when_waiting_on_you\":\"जिस पल कोई इंसिडेंट किसी इंसान पर अटकता है, तभी चलता है।\",\"choose_a_source\":\"कोई सोर्स चुनो\",\"cli\":\"CLI.\",\"companions_installed_one\":\"{{count}} अडैप्टर पैकेज इंस्टॉल है: {{names}}। मंज़ूरी मिलने पर उनके सोर्स ऊपर की सूची में दिखने लगते हैं; न दिखें तो फ़्लीट की एडमिशन नीति ने उन्हें ठुकरा दिया — गेटवे लॉग देखो।\",\"companions_installed_other\":\"{{count}} अडैप्टर पैकेज इंस्टॉल हैं: {{names}}। मंज़ूरी मिलने पर उनके सोर्स ऊपर की सूची में दिखने लगते हैं; न दिखें तो फ़्लीट की एडमिशन नीति ने उन्हें ठुकरा दिया — गेटवे लॉग देखो।\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"पहले कोई सिग्नल सोर्स कनेक्ट करो — जो नियम बिना कॉन्फ़िगर किए प्रोवाइडर का नाम लेता है वह कभी मैच नहीं कर सकता।\",\"credential_retention_note\":\"ऐप के फ़ोल्डर के बाहर रखे जाते हैं, इसलिए एजेंट उन्हें पढ़ नहीं सकता। ध्यान दो: इस ऐप को हटाने से वे नहीं मिटते। क्रेडेंशियल पूरी तरह हटाना है तो पहले यहीं रद्द करो।\",\"desktop_notifications\":\"डेस्कटॉप सूचनाएँ\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEAD को जान-बूझकर छेड़ा नहीं जाता: पहले चल रहा merge या rebase पूरा करो या रद्द करो, क्योंकि उसके बीच में ref हिलाने से वह काम खो सकता है।\",\"enable_provider\":\"{{provider}} चालू करो\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"एक्सचेंज सिर्फ़ हर रात के मेंटेनेंस पास पर होता है — हर इंसिडेंट पर नहीं। यह उसी इंस्टेंस पर\\n          चलता है जिस पर \\\"हर रात लेजर मेंटेनेंस\\\" चालू है (नीचे Instance देखो), इसलिए जिस इंस्टेंस\\n          पर वह बंद है वह कभी pull नहीं करता: वह उसी कॉपी से काम करता है जो उसके पास पहले से है,\\n          और उसमें शामिल है\",\"expected_shape_label\":\"अपेक्षित रूप\",\"explicitly_every_time_what_does_not_work_is\":\"हर बार साफ़ तौर पर।\\n          जो काम नहीं करता वह है\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"इसे Slack में चैनल के डिटेल डायलॉग के सबसे नीचे ढूँढो। पहले {{productName}} बॉट को चैनल\\n            में बुलाओ, वरना पोस्ट करना नाकाम रहेगा।\",\"get_a_notification_when_something_changes_that_n\":\"जब कोई ऐसी चीज़ बदले जिसके लिए तुम चाहिए, तब सूचना पाओ — कोई Slack वर्कस्पेस नहीं और\\n        किसी तरह का कोई क्रेडेंशियल नहीं। यह {{productName}} के नोटिफ़िकेशन सेंटर और तुम्हारे\\n        डेस्कटॉप पर जाती है।\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"{{whoKey}} में यह इंस्टेंस खुद को कैसे पहचानता है। खाली छोड़ दो तो लोकल {{ghCli}} CLI जिस लॉगिन से प्रमाणित है वही चलेगा।\",\"grant\":\"अधिकार दो\",\"heartbeat_pacing\":\"हार्टबीट की चाल\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"हार्टबीट एक बार में कितना उठाता है, और काम वापस सौंपने से पहले कितनी देर रुकता है।\\n        इंसिडेंट छोड़ देने से वह सुलझता नहीं — सिग्नल दोबारा उठाने लायक हो जाता है, ताकि जिस\\n        जाँच का एजेंट मर गया वह दोबारा हो, बजाय अलार्म को हमेशा के लिए बाँध रखने के।\",\"in_force_now\":\"अभी लागू\",\"instance\":\"इंस्टेंस\",\"interrupts_by_default\":\"· डिफ़ॉल्ट रूप से टोकता है\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"किसी शिफ़्ट में नामित नहीं है, और\\n                सख़्त गेटिंग बंद है — इसलिए यह इंस्टेंस शेड्यूल की परवाह किए बिना काम उठाता है,\\n                और जो ऑन-कॉल है उसे तरजीह नहीं देता। इसे किसी\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"किसी शिफ़्ट में नामित नहीं है, इसलिए\\n                सख़्त गेटिंग में यह इंस्टेंस कभी काम नहीं उठाएगा। इसे किसी\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"रिपो में\\n          हाथ से हल न हो जाए — कॉन्फ़्लिक्ट मार्कर से भरा शेड्यूल प्रकाशित करने पर हर साथी यह\\n          समझ ही नहीं पाएगा कि ऑन-कॉल कौन है।\",\"it_last_saw\":\"की वह कॉपी, जो उसने आख़िरी बार\\n          देखी थी।\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"अगर Ops Mission Control सिर्फ़ तुम चला रहे हो तो इसे चालू रहने दो। एक ही लेजर साझा करने\\n          वाली टीम में ठीक एक इंस्टेंस प्राइमरी होना चाहिए, ताकि मेंटेनेंस पास हर आदमी के लिए\\n          अलग-अलग न चले।\",\"ledger_conflict\":\"लेजर कॉन्फ़्लिक्ट\",\"ledger_intro\":\"तुम्हारी टीम का नॉलेज लेजर, एक आम git रिपो के ज़रिए एक्सचेंज होता है: {{file}} को हर रात का मेंटेनेंस पास pull और push करता है।\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"सूची में जोड़ो, अगर यह तय करना रोटेशन का\\n                काम है कि कौन जवाब दे।\",\"list_or_correct_the_login_above\":\"सूची में जोड़ो, या ऊपर लॉगिन ठीक करो।\",\"loading\":\"लोड हो रहा है…\",\"main\":\"main\",\"min\":\"मिनट\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"इंसिडेंट को किसी चैनल में लाइव बोर्ड की तरह उतारो: हर इंसिडेंट का एक मैसेज, जिसकी हालत\\n        उसी जगह अपडेट होती रहती है और निदान उसके थ्रेड में रहता है। यह वही Slack कनेक्शन\\n        इस्तेमाल करता है जो {{productName}} के पास पहले से है — यह ऐप अपना कोई Slack टोकन नहीं रखता।\",\"mirror_incidents_to_slack\":\"इंसिडेंट को Slack पर उतारो\",\"mode_act_label\":\"कार्रवाई\",\"mode_help_act\":\"उन सिग्नल पैटर्न पर कार्रवाई करता है जिन्हें तुमने किसी नियम से साफ़ तौर पर मंज़ूरी दी है। नियम में सोर्स और रिसोर्स पैटर्न, दोनों का नाम होना चाहिए — कोई \\\"सब कुछ\\\" वाला नियम नहीं है। हर कार्रवाई का ऑडिट होता है।\",\"mode_help_observe\":\"सिग्नल पढ़ता है और जाँच करता है। किसी भी प्रोवाइडर में कुछ नहीं लिखता। यह डिफ़ॉल्ट है और शुरू करने की सुरक्षित जगह।\",\"mode_help_propose\":\"जो Observe करता है वह सब, और साथ में स्वीकारने / सुलझाने / टिप्पणी करने की कार्रवाई का ड्राफ़्ट बनाकर पहले तुमसे पूछता है। बिना मंज़ूरी कुछ नहीं चलता।\",\"mode_observe_label\":\"निगरानी\",\"mode_propose_label\":\"प्रस्ताव\",\"needs_human_derived\":\"अभी {{value}}, जो ऊपर की अवधि से निकला है, इसलिए वह बदलेगी तो यह भी बदलेगा। यहाँ सेट करने से यह पक्का हो जाता है।\",\"needs_human_pinned\":\"{{value}} पर पक्का, ऊपर की अवधि से अलग।\",\"needs_setup\":\"सेट अप चाहिए\",\"new_claims_per_heartbeat\":\"हर हार्टबीट में कितने नए उठाए जाएँ\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"अगला sync इसे खुद ही पार ले जाता है, बशर्ते उस नाम की कोई दूसरी ब्रांच पहले से न हो — तब वह कौन-सा इतिहास रखना है यह चुनने की जगह मना कर देता है, और ऊपर का संदेश बताता है कि कौन-सा merge चलाना है।\",\"no_branch_detached_head\":\"कोई ब्रांच नहीं (detached HEAD)\",\"no_credential_note\":\"कोई क्रेडेंशियल नहीं डालना है: sync, {{gitCmd}} को तुम्हारी ही तरह चलाता है, तुम्हारी अपनी SSH कुंजी या क्रेडेंशियल हेल्पर के साथ। SSH रिमोट ({{sshRemote}}) बेहतर है — टोकन वाला URL कभी मत चिपकाओ, क्योंकि इस ऐप की सेटिंग फ़ाइल बिना साइन-इन पढ़ी जा सकती है। {{defaultBranch}} के लिए ब्रांच खाली छोड़ दो।\",\"no_github_login_resolved_for_this_instance_so_it\":\"इस इंस्टेंस के लिए कोई GitHub लॉगिन तय नहीं हुआ, इसलिए यह बता नहीं सकता कि वह\\n                ऑन-कॉल है या नहीं। ऊपर एक दर्ज करो, या इसे प्रमाणित करो:\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"अभी कोई नियम नहीं — किसी ख़ास रिसोर्स समूह पर अधिकार देने के लिए नीचे एक जोड़ो।\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"यह गेटवे इसकी ख़बर नहीं देता, इसलिए जो मान लागू हैं वे दिखाए नहीं जा सकते।\",\"not_set\":\"सेट नहीं\",\"not_set_up\":\"सेट अप नहीं\",\"notify_me_on_state_changes\":\"हालत बदलने पर मुझे बताओ\",\"off\":\"बंद\",\"on_call_schedule\":\"ऑन-कॉल शेड्यूल\",\"one_notification_per_state_change_never_per_hear\":\"हर हालत-बदलाव पर एक सूचना, हर हार्टबीट पर कभी नहीं: जो सोर्स बंद पड़ा रहता है उसकी\\n        ख़बर एक बार जाती है, हर दो मिनट पर नहीं। एक ही इंसिडेंट की बार-बार आने वाली सूचनाएँ\\n        एक पंक्ति में जुड़ जाती हैं।\",\"only_the_on_call_instance_picks_up_work\":\"काम सिर्फ़ ऑन-कॉल इंस्टेंस उठाता है\",\"pagerduty_user_id_help\":\"PagerDuty जिसे ऑन-कॉल बताता है उससे मिलाया जाता है, ताकि यह इंस्टेंस बता सके कि पेजर तुम्हारा है या नहीं। वहाँ रखा जाता है जहाँ एजेंट पहुँच नहीं सकता — खाली छोड़ दो तो शेड्यूल पर जो भी हो उसे तुम मान लिया जाएगा।\",\"incidentio_user_id_help\":\"तुम्हारी incident.io शेड्यूल पर मौजूद यूज़र्स से मिलाया जाता है, ताकि यह इंस्टेंस बता सके कि शिफ़्ट तुम्हारी है या नहीं। वहाँ रखा जाता है जहाँ एजेंट पहुँच नहीं सकता — खाली छोड़ दो तो शेड्यूल पर जो भी हो उसे तुम मान लिया जाएगा। ID सेट हो लेकिन कोई शेड्यूल कॉन्फ़िगर न हो, तो यह इंस्टेंस शिफ़्ट से बाहर ही रहता है।\",\"identity_save_refused\":\"तुम्हारा ID सहेजा नहीं गया — सेटिंग्स स्टोर ने लिखने से मना कर दिया। फिर से कोशिश करो।\",\"change_save_refused\":\"तुम्हारा बदलाव सहेजा नहीं गया — सेटिंग्स स्टोर ने लिखने से मना कर दिया। फिर से कोशिश करो।\",\"value_too_long_refused\":\"वह मान बहुत लंबा है, इसलिए सहेजा नहीं गया।\",\"prod_star\":\"prod-*\",\"providers\":\"प्रोवाइडर\",\"pushes_stay_refused_until\":\"पुश तब तक मना होते रहेंगे जब तक\",\"quiet_and_expires_on_its_own\":\"· शांत, और अपने आप खत्म हो जाता है\",\"ready\":\"तैयार\",\"release_a_question_after\":\"सवाल इतनी देर बाद छोड़ो\",\"release_an_investigation_after\":\"जाँच इतनी देर बाद छोड़ो\",\"remote\":\"रिमोट\",\"replace\":\"बदलो\",\"repository\":\"रिपॉज़िटरी\",\"resolved_from_the_gh_cli_when_blank\":\"खाली हो तो gh CLI से तय होता है\",\"resource_pattern\":\"रिसोर्स पैटर्न\",\"revoke_rule\":\"नियम रद्द करो\",\"revoke_stored_credentials\":\"रखे हुए क्रेडेंशियल रद्द करो\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"को लेजर डायरेक्टरी में हाथ से चलाओ,\\n          क्योंकि इस ब्रांच का कोई upstream नहीं है।\",\"run_nightly_ledger_maintenance_on_this_instance\":\"इस इंस्टेंस पर हर रात लेजर मेंटेनेंस चलाओ\",\"save\":\"सेव करो\",\"schedule_conflict\":\"शेड्यूल कॉन्फ़्लिक्ट\",\"schedule_location_note\":\"यहाँ चुनने के लिए कोई पाथ नहीं है: शेड्यूल एक {{schedule}} है, जो ऊपर वाले रिपो में {{ledger}} के साथ कमिट होता है। जगह जान-बूझकर तय है, क्योंकि जिस रोटेशन को हर इंस्टेंस पढ़ता है उसे वहीं रहना चाहिए जहाँ हर इंस्टेंस देखता है।\",\"share_the_knowledge_ledger_with_my_team\":\"नॉलेज लेजर अपनी टीम के साथ साझा करो\",\"shared_team_memory\":\"साझा टीम याद\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"ऊपर साझा करना सेट अप नहीं है, इसलिए शेड्यूल वही है जो इस मशीन पर मौजूद है और\\n            किसी और तक नहीं पहुँचता।\",\"signal_source\":\"सिग्नल सोर्स\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"रखा हुआ — बदलने के लिए नया मान डालो\",\"strict_off_explanation\":\"जब शेड्यूल यह न बता सके कि तुम ऑन-कॉल हो या नहीं, तब भी यह इंस्टेंस काम करता है — और बाक़ी हर इंस्टेंस भी, इसलिए दो साथी एक ही अलर्ट पर काम कर सकते हैं। इसे सिर्फ़ अकेले वाले इंस्टॉल पर चुनो।\",\"strict_on_explanation\":\"जब शेड्यूल यह न बता सके कि तुम ऑन-कॉल हो या नहीं, तो यह इंस्टेंस पीछे हट जाता है। इसी से एक अलर्ट पर ठीक एक साथी काम करता है।\",\"syncing\":\"सिंक हो रहा\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"यह इंस्टेंस ज़्यादा से ज़्यादा इतना कर सकता है। हर सिग्नल का नियम इसे घटा सकता है, बढ़ा\\n          कभी नहीं — इसलिए इसे Observe पर छोड़ देने से ऐप सिर्फ़-पढ़ने वाला रहता है, चाहे कोई\\n          भी नियम मौजूद हों।\",\"this_repo_is_on\":\"यह रिपो इस पर है:\",\"to_silence_one_of_these_without_turning_the_rest\":\"बाक़ी को बंद किए बिना इनमें से किसी एक को चुप कराना हो — या यह बदलना हो कि वह कितनी\\n            ज़ोर से टोकता है — तो Settings → Notifications इस्तेमाल करो, जहाँ हर ऐप का चैनल\\n            सूचीबद्ध है। कोई चैनल वहाँ पहली बार चलने के बाद दिखता है।\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"जिन सिस्टम पर नज़र चाहिए उन्हें चालू करो। AWS तुम्हारे मौजूदा क्रेडेंशियल इस्तेमाल करता\\n          है — कोई कुंजी नहीं रखी जाती। बाक़ी प्रोवाइडर के टोकन वहाँ रखे जाते हैं जहाँ एजेंट\\n          पढ़ नहीं सकता।\",\"unavailable_here\":\"यहाँ उपलब्ध नहीं\",\"when_a_state_changes\":\"जब हालत बदले\",\"who\":\"who\",\"wrong_local_branch\":\"गलत लोकल ब्रांच\",\"your_github_login\":\"तुम्हारा GitHub लॉगिन\",\"your_pagerduty_user_id\":\"तुम्हारा PagerDuty यूज़र ID\",\"your_incident_io_user_id\":\"तुम्हारा incident.io यूज़र ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"तुम्हारी टीम का लेजर अभी एक्सचेंज हो रहा है — sync जिसका नाम लेता है वह है\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"जो सिग्नल इस पोल में नहीं है उसे सुधरा हुआ माना जा सकता है।\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"सब हमारे शेप हैश पर, जो सिर्फ़ किसी संख्या में फ़र्क़ रखने वाले अलार्म को एक कर देता है। याद रखे गए हल को इसी हिसाब से तोलो।\",\"at_least_one_source_did_not_answer_this_poll\":\"इस पोल का जवाब कम से कम एक सोर्स ने नहीं दिया।\",\"claim\":\"उठाओ\",\"claimed\":\"उठा लिया\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· push से आता है, इसलिए खाली पोल का कोई मतलब नहीं\",\"every_configured_source_answered\":\"हर कॉन्फ़िगर किए सोर्स ने जवाब दिया।\",\"everything_firing_already_has_an_incident\":\"जो कुछ अभी भड़क रहा है, उस सबका इंसिडेंट पहले से है।\",\"firing\":\"भड़क रहा\",\"firing_not_yet_claimed\":\"भड़क रहा है, अभी नहीं उठाया गया\",\"inbound_webhook_queued_one\":\"{{count}} इनबाउंड वेबहुक सिग्नल आ चुका है और अगली साइकिल के उठाने का इंतज़ार कर रहा है — वह अभी बोर्ड पर नहीं है।\",\"inbound_webhook_queued_other\":\"{{count}} इनबाउंड वेबहुक सिग्नल आ चुके हैं और अगली साइकिल के उठाने का इंतज़ार कर रहे हैं — वे अभी बोर्ड पर नहीं हैं।\",\"inhibited_by_alert_go_look_at_that_alert\":\"{{by}} ने रोक रखा है — कोई ऊँचे दर्जे का अलर्ट इसे ढँक रहा है; जाकर उस अलर्ट को देखो।\",\"inhibited_by_another_alert_masking_this_one\":\"किसी दूसरे अलर्ट ने रोक रखा है — कोई ऊँचे दर्जे का अलर्ट इसे ढँक रहा है।\",\"last_poll\":\"पिछला पोल\",\"loading\":\"लोड हो रहा है…\",\"n_d_ago\":\"{{n}} दिन पहले\",\"n_h_ago\":\"{{n}} घंटे पहले\",\"n_ledger_entries_matched\":\"{{count}} लेजर एंट्री मैच हुईं — {{detail}}\",\"n_m_ago\":\"{{n}} मिनट पहले\",\"n_on_own_identity_exact_match\":\"{{count}} इस प्रोवाइडर की अपनी पहचान पर, जो ठीक-ठीक मैच है।\",\"n_s_ago\":\"{{n}} सेकंड पहले\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} सिग्नल\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} मिलता-जुलता सबक़ संदर्भ के लिए जोड़ा गया — यह क़रीब की चीज़ है, मैच नहीं।\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} मिलते-जुलते सबक़ संदर्भ के लिए जोड़े गए — ये क़रीब की चीज़ें हैं, मैच नहीं।\",\"no_attribution_cannot_say_who_parked_it\":\"इस प्रोवाइडर ने कोई श्रेय नहीं बताया, इसलिए हम नहीं कह सकते कि इसे किसने रोका या यह कब लौटेगा।\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"कोई भी पैटर्न फ़ास्ट-पाथ की सीमा पार नहीं कर पाया, इसलिए एजेंट को प्रस्ताव देने से पहले पुष्टि करनी होगी।\",\"no_signal_source_is_configured_so_nothing_was_po\":\"कोई सिग्नल सोर्स कॉन्फ़िगर नहीं है, इसलिए कुछ पोल नहीं हुआ। शांत बोर्ड का अभी कोई\\n                मतलब नहीं — Settings में कोई सोर्स कनेक्ट करो।\",\"no_signal_sources_registered\":\"कोई सिग्नल सोर्स पंजीकृत नहीं है।\",\"no_sources_reporting_a_firing_signal\":\"कोई सोर्स भड़कते सिग्नल की ख़बर नहीं दे रहा।\",\"not_polled_yet_not_the_same_as_healthy\":\"अभी पोल नहीं किया — यह ठीक होने के बराबर नहीं है\",\"nothing_firing_but_parked_signals_not_investigated\":\"कुछ नहीं भड़क रहा, पर ऊपर रोके हुए सिग्नल की जाँच नहीं हो रही\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"कुछ नहीं भड़क रहा — पर {{count}} सिग्नल प्रोवाइडर पर रोका हुआ है (ऊपर देखो) और उठाया नहीं जाएगा।\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"कुछ नहीं भड़क रहा — पर {{count}} सिग्नल प्रोवाइडर पर रोके हुए हैं (ऊपर देखो) और उठाए नहीं जाएँगे।\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"लेजर में कुछ मैच नहीं हुआ, इसलिए जाँच शून्य से शुरू होती है।\",\"nothing_unclaimed\":\"बिना उठाया कुछ नहीं बचा\",\"one_ledger_entry_matched\":\"1 लेजर एंट्री मैच हुई — {{detail}}\",\"parked\":\"रोका हुआ\",\"parked_2\":\"रोका हुआ\",\"parked_at_the_provider\":\"प्रोवाइडर पर रोका हुआ\",\"poll_answered\":\"जवाब दिया\",\"poll_every_configured_source_now_read_only\":\"हर कॉन्फ़िगर किए सोर्स को अभी पोल करो (सिर्फ़ पढ़ना)\",\"poll_now\":\"अभी पोल करो\",\"poll_to_see_what_is_firing\":\"क्या भड़क रहा है, यह देखने के लिए पोल करो।\",\"polling\":\"पोल हो रहा है…\",\"proven_pattern_matched_agent_may_propose_directly\":\"कोई पुष्ट पैटर्न मैच हुआ, इसलिए एजेंट सीधे उसका हल प्रस्तावित कर सकता है।\",\"provider\":\"प्रोवाइडर\",\"push_source_absence_note_one\":\"जो सिग्नल इस पोल में नहीं है उसे सुधरा हुआ माना जा सकता है, सिवाय {{sources}} के — वह push से एक स्पूल में डालता है जिसे हर पोल खाली कर देता है, इसलिए जो सिग्नल एक बार आ चुका है वह दोबारा नहीं दिखेगा, चाहे वह अभी भी भड़क रहा हो या नहीं।\",\"push_source_absence_note_other\":\"जो सिग्नल इस पोल में नहीं है उसे सुधरा हुआ माना जा सकता है, सिवाय {{sources}} के — वे push से एक स्पूल में डालते हैं जिसे हर पोल खाली कर देता है, इसलिए जो सिग्नल एक बार आ चुका है वह दोबारा नहीं दिखेगा, चाहे वह अभी भी भड़क रहा हो या नहीं।\",\"recovered\":\"सुधरा हुआ\",\"reported_recovered\":\"सुधरा हुआ बताया गया\",\"signal_sources\":\"सिग्नल सोर्स\",\"silenced_by_review_or_let_expire\":\"{{by}} ने चुप करा दिया है — समीक्षा करो, या प्रोवाइडर पर उस चुप्पी को खुद खत्म होने दो।\",\"someone_silenced_these_where_they_came_from_so_t\":\"किसी ने इन्हें वहीं चुप करा दिया जहाँ से ये आए थे, इसलिए इनकी जाँच नहीं हो रही और\\n            कोई इंसिडेंट नहीं खोला गया। ये यहाँ इसलिए दिख रहे हैं कि वरना \\\"किसी इंसान ने रोका\\\"\\n            और \\\"ऐप ने अनदेखा किया\\\" एक ही जैसे लगते।\",\"source\":\"सोर्स\",\"sources_did_not_answer_this_poll\":\"{{sources}} ने इस पोल का जवाब नहीं दिया।\",\"spool_full_note\":\"स्पूल {{limit}} पर भर चुका है, इसलिए नए आते ही सबसे पुरानी डिलीवरी फेंकी जा रही हैं। Board से एक साइकिल चलाओ (\\\"पोल करो और उठाओ\\\")।\",\"state\":\"हालत\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"हार्टबीट हर साइकिल में कुछ ही उठाता है, इसलिए झोंका आने पर क़तार लग जाती है। बिना\\n          इंतज़ार जाँच शुरू करने के लिए अभी एक उठा लो।\",\"the_provider_said_these_are_back_to_normal_unlik\":\"प्रोवाइडर ने कहा कि ये सामान्य पर लौट आए हैं। जो सिग्नल बस दिखना बंद हो गया, उसके\\n            उलट यह वह सबूत है जिस पर तुम सुलझा हुआ मान सकते हो।\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"यह सोर्स एक स्पूल में push करता है जिसे हर पोल खाली कर देता है, इसलिए जो सिग्नल वह एक बार दे चुका है वह दोबारा नहीं दिखेगा, चाहे गड़बड़ी अभी भी ज़िंदा हो।\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"काम कहाँ से आता है। क्रेडेंशियल और दायरा Settings में कॉन्फ़िगर करो; कोई सोर्स असल में\\n          क्या लौटाता है यह देखने के लिए यहाँ पोल करो।\",\"while_that_is_true_absence_of_a_signal_does_not\":\"यह सही है, पर सिग्नल न दिखने का मतलब सुधार नहीं है — इसका मतलब सिर्फ़ यह भी हो\\n                सकता है कि हम देख ही नहीं पाए।\",\"firing_count_one\":\"{{count}} भड़क रहा ·\",\"firing_count_other\":\"{{count}} भड़क रहे ·\",\"parked_count_one\":\"{{count}} प्रोवाइडर पर रोका हुआ ·\",\"parked_count_other\":\"{{count}} प्रोवाइडर पर रोका हुआ ·\",\"cleared_count_one\":\"{{count}} शांत हुआ ·\",\"cleared_count_other\":\"{{count}} शांत हुए ·\",\"unclaimed_count_one\":\"{{count}} अभी नहीं उठाया गया\",\"unclaimed_count_other\":\"{{count}} अभी नहीं उठाए गए\"}}}") },
	it: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"Un primo soccorritore autonomo per le emergenze operative. Tiene d’occhio i tuoi allarmi, le chiamate di reperibilità e i monitor; prende in carico ciò che scatta; indaga con contesto reale; e propone una correzione — conservando in un registro locale tutto ciò che impara, così la seconda volta è più rapida della prima.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Prende in carico un allarme che scatta entro un heartbeat e indaga prima che qualcuno debba guardare\",\"highlight_2\":\"Registro di conoscenza con livelli di confidenza e di fiducia — un guasto che si ripete si risolve con quello che già sai\",\"highlight_3\":\"Bacheca in tempo reale nella dashboard e come thread Slack a cui puoi rispondere, così il canale è la dashboard\",\"highlight_4\":\"Si collega ad AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues o a qualsiasi sistema in grado di fare POST di JSON firmato — compresi i payload in formato Alertmanager, suddivisi in un incidente per ogni avviso\",\"highlight_5\":\"Di sola lettura per impostazione predefinita — le azioni di scrittura vanno attivate per singolo schema di segnale, e ognuna viene tracciata\",\"highlight_6\":\"Conosce i turni: il livello di automazione in servizio si arma e si disarma da sé\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Monitora i segnali operativi, indaga sugli incidenti, riutilizza le correzioni collaudate e consegna una traccia di controllo locale completa.\",\"configuration_1\":\"Aggiungi provider nelle Impostazioni con credenziali d'ambiente o token, mantieni Observe per l'uso in sola lettura e abilita esplicitamente le azioni Propose o Act consentite; l'output Slack riutilizza una connessione Kiro Crew esistente.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_many\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_many\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_many\":\"{{count}} shifts\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_many\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_many\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Lo trovi in fondo alla finestra dei dettagli del canale in Slack. Invita prima il bot {{productName}} nel canale, altrimenti la pubblicazione fallirà.\",\"get_a_notification_when_something_changes_that_n\":\"Ricevi una notifica quando cambia qualcosa che richiede il tuo intervento — senza spazio di lavoro Slack e senza credenziali di alcun tipo. Arriva nel centro notifiche di {{productName}} e sul tuo desktop.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Rispecchia gli incidenti in un canale come una bacheca in tempo reale: un messaggio per incidente il cui stato si aggiorna sul posto, con la diagnosi nel suo thread. Usa la connessione Slack che {{productName}} ha già — questa app non salva alcun token Slack proprio.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"Viene confrontato con gli utenti della tua programmazione su incident.io, così questa istanza può capire se il turno è tuo. Viene conservato dove l’agente non può arrivare — lascialo vuoto per trattare chiunque nella programmazione come te. Con un ID impostato ma nessuna programmazione configurata, questa istanza resta fuori turno.\",\"identity_save_refused\":\"Il tuo ID non è stato salvato — lo store delle impostazioni ha rifiutato la scrittura. Riprova.\",\"change_save_refused\":\"La tua modifica non è stata salvata — lo store delle impostazioni ha rifiutato la scrittura. Riprova.\",\"value_too_long_refused\":\"Quel valore è troppo lungo, quindi non è stato salvato.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_many\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_many\":\"{{count}} signals\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_many\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_many\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_many\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} in allarme ·\",\"firing_count_many\":\"{{count}} in allarme ·\",\"firing_count_other\":\"{{count}} in allarme ·\",\"parked_count_one\":\"{{count}} sospeso presso il provider ·\",\"parked_count_many\":\"{{count}} sospesi presso il provider ·\",\"parked_count_other\":\"{{count}} sospesi presso il provider ·\",\"cleared_count_one\":\"{{count}} risolto ·\",\"cleared_count_many\":\"{{count}} risolti ·\",\"cleared_count_other\":\"{{count}} risolti ·\",\"unclaimed_count_one\":\"{{count}} non ancora preso in carico\",\"unclaimed_count_many\":\"{{count}} non ancora presi in carico\",\"unclaimed_count_other\":\"{{count}} non ancora presi in carico\"}}}") },
	ja: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"バックオフ中\",\"source_health_failed\":\"失敗\",\"source_health_not_polled_yet\":\"まだポーリングされていません\",\"source_health_not_set_up\":\"セットアップされていません\",\"the_last_poll_failed\":\"最後のポーリングが失敗しました。\",\"verification_confirmed_label\":\"確認済み\",\"verification_confirmed_meaning\":\"応答したソースに対する{{verb}}の後に信号を再度読み取り、それはもう発火していません。\",\"verification_could_not_check_label\":\"確認できませんでした\",\"verification_could_not_check_meaning\":\"再チェックが予定されていましたがソースが応答しなかったため、これは確実な情報になりません。後の周期で自動的に再試行されます。\",\"verification_not_checkable_label\":\"送信済み、未確認\",\"verification_not_checkable_meaning\":\"{{verb}}は受け入れられましたが、このアプリは効果があったかどうかを観察できません。確認応答はアラートを意図的に発火したままにするため、アラーム状態はどちらの場合についても何も示しません。\",\"verification_pending_label\":\"まだ確認されていません\",\"verification_pending_meaning\":\"{{verb}}は成功を返しました。これはプロバイダーがリクエストを受け入れたことのみを意味します。次のハートビートが信号を再度読み取り、効果があったかどうかを調べます。\",\"verification_pending_meaning_at\":\"{{verb}}は成功を返しました。これはプロバイダーがリクエストを受け入れたことのみを意味します。{{when}}の後の次のハートビートが信号を再度読み取り、効果があったかどうかを調べます。\",\"verification_still_firing_label\":\"このアクション後も発火中\",\"verification_still_firing_meaning\":\"プロバイダーは {{verb}} を受け入れましたが、再確認した時点でもシグナルは発火していました。このインシデントの原因となった状態は現在も継続しています。\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"同じ障害が2回マッチすると、パターンがここに表示されます。1回の発生はパターンではなく、インシデントです。\",\"applied_and_the_signal_kept_firing_afterwards\":\"適用されました。その後も信号は発火し続けました\",\"at_least_one_source_did_not_answer_the_last_poll\":\"少なくとも1つのソースが最後のポーリングに応答しませんでした。\",\"building_the_digest\":\"ダイジェストを構築中…\",\"claimed_by_hand\":\"手動で引き受け\",\"claimed_by_hand_not_the_heartbeat\":\"手動で引き受け、ハートビートではない\",\"copied\":\"コピーしました\",\"copy_as_text\":\"テキストでコピー\",\"copy_the_digest_as_text_for_a_handover_thread\":\"ハンドオーバースレッド用にダイジェストをテキストでコピー\",\"coverage\":\"カバレッジ\",\"derived_from_configuration_only_no_source_has_be\":\"設定のみから導出 — このセッションではソースがポーリングされていないため、\\n              これはそれらが応答することの証拠ではありません。シグナルタブからポーリングしてください。\",\"escalated_to_someone_else\":\"他の誰かにエスカレーション\",\"every_configured_source_answered_the_last_poll\":\"構成されたすべてのソースが最後のポーリングに応答しました。\",\"failed\":\"失敗\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"別のオーナーに引き渡されたため、このアプリの作業ではなくなりました。ただし、\\n            あなたがそれを追跡しなければならない人かもしれません。\",\"handover\":\"ハンドオーバー\",\"no_recurring_patterns_yet\":\"繰り返しパターンはまだありません\",\"not_configured_blind_spots\":\"設定されていません(ブラインドスポット):{{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"何も監視されていないため、静かなボードは何も意味しません。\\n              設定でソースに接続してください。\",\"pattern_proven\":\"証明済み\",\"refresh\":\"リフレッシュ\",\"refreshing\":\"リフレッシュ中…\",\"source_not_answering\":\"{{name}}(応答なし)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}}は最後のポーリングに応答しませんでした。\",\"stopped_with_no_diagnosis\":\"診断なしで停止\",\"the_investigation_ended_without_recording_anythi\":\"調査は何も記録されないまま終了したため、引き継ぐスレッドがありません。\\n            回答するのではなく、調査をやり直す必要があります。\",\"these_do_not_progress_on_their_own_an_unanswered\":\"これらは自動的に進行しません。前のシフトからの未回答のプロンプトが、\\n            このシフトの最初の仕事です。\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"この修正が適用されました。その後も信号は発火していました。\\n                    答えとして引き渡さないでください。既に試みたことを述べてください。\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"これが修正されるまで、静かなボードは回復の証拠ではありません。\",\"waiting_on_you\":\"あなたを待機中\",\"watching_nothing\":\"監視中:なし\",\"watching_sources\":\"監視中:{{sources}}\",\"what_keeps_happening\":\"何が繰り返し発生しているか\"},\"incidentChat\":{\"ask_about_incident\":\"{{incidentId}}について質問…\",\"live_investigation_header\":\"{{incident}}{{title}}のライブ調査。エージェントに答えるか、それを操向するにはここで返信してください。\"},\"manifest\":{\"use_case_1\":\"運用シグナルを監視し、インシデントを調査し、実績のある修正を再利用して、完全なローカル監査証跡を引き継ぎます。\",\"configuration_1\":\"設定で環境認証情報またはプロバイダートークンを使ってプロバイダーを追加します。読み取り専用では Observe のままにし、許可する Propose または Act アクションを明示的に有効にします。Slack への出力は既存の Kiro Crew 接続を再利用します。\",\"description\":\"自律型オペレーション初期対応者。アラーム、ページ、モニターを監視し、発火したものを引き受け、実際のコンテキストで調査し、修正を提案します。すべての学習を地元の元帳に保持するため、2番目の発生は最初よりも高速です。\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"発火したアラームを1ハートビート以内に引き受け、誰も見る必要があるまえに調査します\",\"highlight_2\":\"信頼度と信頼レベルを持つ知識元帳 — 繰り返し障害は既知のもので解決します\",\"highlight_3\":\"ダッシュボードの動的ボードと返信可能な Slack スレッド。チャネルはダッシュボード\",\"highlight_4\":\"AWS CloudWatch、PagerDuty、Datadog、incident.io、GitHub Issues、または署名された JSON をPOSTできる任意のシステムに接続 — Alertmanager型ボディも含めて、1インシデントごとにファンアウト\",\"highlight_5\":\"デフォルトは読み取り専用 — 書き込みアクションはシグナルパターンごとにオプトインであり、すべて監査されます\",\"highlight_6\":\"ローテーション対応:オンシフト自動化層は自動的にアーミングと解除を行います\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"実行\",\"active\":\"アクティブ\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× - 誰でもそれらの2つの値を記録できるため、\\n                                      高速パスも必要です\",\"approve_and_run\":\"承認して実行\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"少なくとも1つのソースが最後のポーリングに応答しなかったため、信号がないことは回復を意味しません。\",\"autonomous_first_responder_for_your_alarms_pages\":\"アラーム、ページ、モニターの自律型初期対応者\",\"awaiting_your_approval\":\"あなたの承認を待機中\",\"board\":\"ボード\",\"claiming\":\"引き受け中…\",\"closed_postmortems\":\"クローズ — ポストモーテム\",\"confidence\":\"信頼度\",\"confidence_2\":\"信頼度\",\"connect_a_provider_in_settings_to_start_watching\":\"監視を開始するには設定でプロバイダーに接続してください。\",\"copied\":\"コピーしました\",\"copy_postmortem\":\"ポストモーテムをコピー\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"チケットまたはレビュー用に、ポストモーテムを正確にコピー\",\"demoted\":\"降格\",\"demoted_note\":\"降格:この修正が適用されました。その後も信号は発火していました{{recent}}。時々機能する修正は何もないより価値があるため保持されていますが、答えではなく既に試みたものとして扱ってください。\",\"demoted_refuted_summary_plural\":\"{{demoted}}個中{{total}}個のエントリが反証されました。修正が適用され、信号は発火し続けました。上記の{{rows}}行すべてにはないかもしれません。\",\"demoted_refuted_summary_singular\":\"{{demoted}}個中{{total}}個のエントリが反証されました。修正が適用され、信号は発火し続けました。上記の{{rows}}行すべてにはないかもしれません。\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"アクションドラフトと質問 — 未承認のものは実行されません\",\"empty_each_investigation_that_finds_a_reusable_f\":\"空。再利用可能な修正を見つけた各調査はここにそれを記録するため、\\n              繰り返し障害は既知のもので解決します。\",\"every_configured_source_answered_the_last_poll_s\":\"構成されたすべてのソースが最後のポーリングに応答したため、この静かさは本物です。\",\"executes_actions_granted_by_your_rules_every_one\":\"ルールによって許可されたアクションを実行 — すべて監査されます\",\"expand_the_row_below_for_what_was_attempted_the\":\"試みたことについては下の行を展開してください。\\n                引用された元帳エントリは失敗したものとしてマークされています。\",\"expires_at_time\":\"{{time}}に期限切れ\",\"failed\":\"失敗\",\"failed_2\":\"失敗\",\"fast_path\":\"高速パス\",\"fix_label\":\"修正:{{fix}}\",\"hypothesis_agent_must_confirm_first\":\"仮説 — エージェントが最初に確認する必要があります\",\"is_no_longer_in_the_ledger\":\"はもはや\\n                                    元帳にありません。\",\"knowledge_ledger\":\"知識元帳\",\"known_patterns\":\"既知のパターン\",\"leader\":\"リーダー\",\"ledger_entry_locked\":\"ロック\",\"ledger_entry_unlocked\":\"ロック解除\",\"loading\":\"読み込み中…\",\"mark_resolved\":\"解決済みとしてマーク\",\"marked_verified_and_high_confidence_but_used_onl\":\"検証済みおよび高信頼度としてマークされましたが、使用のみ\",\"match_basis\":\"マッチ基準\",\"match_basis_exact\":\"{{source}}はこの障害の正確なIDを公開しており({{key}})、元帳は私たちの形状ハッシュよりもこれを好みます。\",\"matched_entry\":\"マッチされたエントリ\",\"member_is_this_instance\":\"{{login}}(このインスタンス)\",\"mission_control\":\"Mission Control\",\"mode\":\"モード\",\"n_matched\":\"{{count}}個マッチ\",\"no_diagnosis_recorded_yet\":\"診断はまだ記録されていません。\",\"no_github_login_resolved_for_this_instance_so_it\":\"このインスタンスの GitHub ログインが解決されていないため、オンコール状態を判断できません。\\n                schedule-file プロバイダーの github_login を設定するか、\\n                gh CLI を認証してください。\",\"no_incidents_claimed\":\"引き受けられたインシデントなし\",\"no_postmortem_was_written_for_this_incident_inci\":\"このインシデントのポストモーテムは作成されていません。\\n        ポストモーテムが作成される前にクローズされたインシデントには存在せず、何もそれをバックフィルしません。\\n        レコードは発明されなければなりません。\",\"no_providers_set_up_open_settings_to_connect_one\":\"プロバイダーはまだセットアップされていません。設定を開いて接続してください。\",\"no_source_configured_nothing_polled_connect_one\":\"ソースが設定されていないため、ポーリングされていません。設定でプロバイダーに接続してください。\",\"none_matched\":\"マッチなし\",\"not_on_roster_lenient\":\"このインスタンス({{me}})はスケジュールに名前がありません。厳密なゲートがオフであるため、引き続き作業を拾うことができます。これはチームメイトを待つ必要がないことを意味します。ローテーションが決定することを意図している場合は、who:リストに追加してください。\",\"not_on_roster_strict\":\"このインスタンス({{me}})はスケジュールに名前がないため、厳密なゲートの下では作業を拾うことはできません。rotation.yamlのwho:リストに追加するか、設定で GitHub ログインを修正してください。\",\"nothing_claimed_but_the_board_is_not_verified\":\"引き受け済みなし — ただしボードは検証されていません\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"まだ何もクローズされていません。インシデントが解決またはエスカレーションされた場合、\\n          ポストモーテムはここに作成されます。インシデントごと1つの Markdown ファイル。\\n          チケットに添付したり、同僚に渡したりする形式です。\",\"nothing_is_firing\":\"何も発火していません\",\"observe\":\"観察\",\"off_shift\":\"オフシフト\",\"off_shift_who_is_on_call\":\"オフシフト — {{who}}がオンコール中{{until}}\",\"on_call_now\":\"今オンコール中\",\"on_call_team\":\"オンコールチーム\",\"on_shift\":\"オンシフト{{until}}\",\"on_shift_who\":\"オンシフト:{{who}}{{until}}\",\"open_in_provider\":\"プロバイダーで開く\",\"pattern\":\"パターン\",\"patterns_known\":\"既知パターン\",\"patterns_proven\":\"証明済みパターン\",\"poll_and_claim\":\"ポーリングと引き受け\",\"poll_every_configured_source_now_and_claim_anyth\":\"すべての構成済みソースをポーリングし、新しいものを引き受け\",\"polled_summary_other\":\"{{polled}}個の発火シグナルをポーリングしました。引き受ける新しいものはありません。\",\"polled_summary_with_parked_other\":\"{{polled}}個の発火シグナルをポーリングしました。また{{suppressed}}個がプロバイダーにパークされており、放置されています。引き受ける新しいものはありません。\",\"propose\":\"提案\",\"proven_agent_may_propose_directly\":\"証明済み — エージェントが直接提案可能\",\"read_only_nothing_is_written_to_any_provider\":\"読み取り専用 — プロバイダーには何も書き込まれません\",\"reading_the_postmortem\":\"ポストモーテムを読み取り中…\",\"reject\":\"却下\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Slack スレッドの返信はこの調査に到達します。\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Slack スレッドへの返信はこの調査に届きません。\\n                              代わりに下のチャットで回答してください。\",\"resource\":\"リソース\",\"rotation_unknown_not_picking_up_work\":\"ローテーション不明 — 作業を拾っていません\",\"rotation_unknown_tier_armed\":\"ローテーション不明 — ティアがアーミング中\",\"runs_nightly_ledger_hygiene_for_the_team\":\"チーム用に夜間元帳衛生を実行\",\"schedule_problem\":\"スケジュール問題:{{error}}\",\"sent\":\"送信済み\",\"sent_n_ago\":\"{{age}}前に送信\",\"shift_other\":\"{{count}}シフト\",\"showing_closed_incidents_other\":\"最近の{{count}}件のクローズされたインシデントを表示\",\"showing_n_of_total\":\"{{shown}}/{{total}} — 古いものはディスク上にありますがこのリストには含まれていません\",\"source\":\"ソース\",\"source_health_not_verified_poll_from_signals_tab\":\"このセッションではソースの健全性が確認されていません。シグナルタブからポーリングして、静寂が本当かどうかを確認してください。\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}}は最後のポーリングに応答しなかったため、シグナルの不在は復旧を意味しません。\",\"sources_wired\":\"接続されたソース\",\"status_dispatched\":\"ディスパッチされました\",\"status_escalated\":\"エスカレーション\",\"status_investigating\":\"調査中\",\"status_needs_human\":\"人的対応が必要\",\"status_resolved\":\"解決済み\",\"status_stale\":\"期限切れ\",\"status_unclaimed\":\"未割り当て\",\"tab_board\":\"ボード\",\"tab_handover\":\"引き継ぎ\",\"tab_settings\":\"設定\",\"tab_signals\":\"シグナル\",\"the_decision_was_refused\":\"決定は拒否されました。\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"このフィックスが適用されましたが、シグナルは発火し続けました\",\"this_provider_published_no_exact_identity_so_any\":\"このプロバイダーが正確なIDを公開していないため、\\n                                いかなる台帳マッチも当社のシェイプハッシュ\\n                                 — 1つのリソースでの4xxと5xxレートなど、\\n                                数値のみが異なるアラームをマージするヒューリスティック。覚えているフィックスをそれに応じて評価してください。\",\"through_sink\":\"{{sink}}を通じて\",\"through_sink_for_duration\":\"{{sink}}を通じて{{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · 当番のインスタンスのみが作業を受け取ります\",\"trust\":\"信頼\",\"unlocked_means_an_investigation_may_propose_this\":\"「ロック解除」とは、\\n              調査が再導出する代わりにこのフィックスを直接提案できることを意味します — これには、\\n              検証された信頼、高い信頼度、少なくとも\",\"until_shift_end\":\"{{end}}まで\",\"used\":\"使用済み\",\"used_2\":\"使用済み\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"使用、および記録された障害なし。\\n              ロックされたエントリはまだ完全な形でエージェントに渡されます。\\n              確認するように指示されます。昇格されたエントリは試行されてシグナルが発火し続けたもので、\\n              これはテストされていない推測よりも強い警告です。\",\"uses_before_an_agent_proposes_it_without_checkin\":\"エージェントが確認せずに提案する前に\\n                                      使用します。\",\"verification_failed_many\":\"このアプリが適用されたと報告したアクション後({{ids}})、再度読み取ったとき{{count}}件のインシデントがまだ発火していました。\",\"verification_failed_one\":\"{{id}}は、このアプリが適用されたと報告したアクション後、再度読み取ったときもまだ発火していました。\",\"waiting_awaiting_approval\":\"続行を承認してください\",\"waiting_awaiting_diagnosis\":\"停止、診断なし\",\"waiting_awaiting_input\":\"ご対応をお待ちしています\",\"waiting_on_you\":\"ご対応をお待ちしています\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"パターンが必要です — ワイルドカード許可はありません。*を使用して接頭辞にマッチさせます。例えば、prod-*はprod-で始まるすべてのリソースをカバーします。\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Actには上記のモードと信号にマッチするルールの両方が必要です。モードだけでは何も許可しません。\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Actは作成したルールにマッチするシグナルにのみ有効です。ルールがない場合、\\n              これはProposeのように動作します。\",\"act_rules\":\"Actルール\",\"active\":\"アクティブ\",\"all_actions\":\"すべてのアクション\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"あなたを待っているインシデントには、より長い猶予時間が与えられます。\\n        睡眠中であることとエージェントのクラッシュは同じではありません。\",\"autonomy\":\"自律性\",\"branch\":\"ブランチ\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"チャネルID\",\"channel_when_incident_released\":\"アイドル調査が再受け取りのためにリリースされたときに発火します。\",\"channel_when_source_health\":\"ソースが応答を停止するポーリングで発火します — ダウンしたままである間は再び発火しません。\",\"channel_when_waiting_on_you\":\"インシデントが人を待つ瞬間に発火します。\",\"choose_a_source\":\"ソースを選択\",\"cli\":\"CLI。\",\"companions_installed_other\":\"{{count}}個のアダプタパッケージがインストールされています：{{names}}。それらのソースは上記のリストに表示されます。許可後に表示されない場合は、フリート許可ポリシーがそれらを拒否しました — ゲートウェイログを確認してください。\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"最初にシグナルソースを接続してください — 設定されていないプロバイダーに名前を付けるルールは決してマッチできません。\",\"credential_retention_note\":\"アプリのフォルダーの外に保存されているため、エージェントは読み取ることができません。注：このアプリをアンインストールしてもそれらは削除されません。削除したい場合はここで最初に取り消してください。\",\"desktop_notifications\":\"デスクトップ通知\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEADは意図的に放置されています：マージまたはリベースが進行中の場合は最初に完了または中止してください。refs を動かすと、その作業が失われる可能性があります。\",\"enable_provider\":\"{{provider}}を有効にする\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"交換は夜間メンテナンス時にのみ行われ、インシデントごとには行われません。\\n          「夜間の台帳メンテナンス」がオンになっているインスタンスで実行されます\\n          （下記の「インスタンス」を参照）。この設定がオフのインスタンスはプルを行わず、\\n          最後に確認した\",\"expected_shape_label\":\"期待されるシェイプ\",\"explicitly_every_time_what_does_not_work_is\":\"明示的に毎回。\\n          機能しないもの\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Slack のチャネル詳細ダイアログの下部で見つけてください。\\n            最初に {{productName}} ボットをチャネルに招待してください。そうしないと投稿が失敗します。\",\"get_a_notification_when_something_changes_that_n\":\"あなたが対応する必要な変更が起きたときに通知を受け取ります — Slack ワークスペースは不要で、\\n        どのような認証情報も必要ありません。\\n        {{productName}} の通知センターとデスクトップに送られます。\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"このインスタンスが{{whoKey}}でどのように認識されるか。ローカル{{ghCli}} CLIが認証されているログインを使用するには空のままにしてください。\",\"grant\":\"許可\",\"heartbeat_pacing\":\"ハートビートペース\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"ハートビートが一度に取得する件数と、作業を戻すまでの待機時間です。\\n        インシデントを解放しても解決済みにはなりません。シグナルは再び取得可能になるため、\\n        エージェントが停止した調査は、\\n        アラームを無期限に固定するのではなく再試行されます。\",\"in_force_now\":\"現在有効\",\"instance\":\"インスタンス\",\"interrupts_by_default\":\"· デフォルトで中断\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"いかなるシフトにも名前がなく、\\n                厳密なゲートはオフです — このインスタンスはスケジュールに関係なく作業を受け取り、\\n                当番の者を減らしません。追加してください。\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"いかなるシフトにも名前がないため、\\n                厳密なゲートの下ではこのインスタンスは決して作業を受け取りません。追加してください。\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"リポジトリで手動で解決されます\\n           — 紛争マーカーでいっぱいなスケジュールを公開すると、\\n          すべてのチームメートが誰が当番かを解析できなくなります。\",\"it_last_saw\":\"を含む既存コピーを\\n          使用します。\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Ops Mission Control を実行している唯一の人である場合、これをオンのままにしてください。\\n          1つの台帳を共有するチームでは、正確に1つのインスタンスがプライマリである必要があります。\\n          そうしないとメンテナンスパスが1人に1回実行されます。\",\"ledger_conflict\":\"台帳の競合\",\"ledger_intro\":\"チームの知識台帳、通常のgitリポジトリを通じて交換：{{file}}は夜間メンテナンスパスによってプルおよびプッシュされます。\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"ローテーションで対応者を決める場合は、\\n                このリストに追加してください。\",\"list_or_correct_the_login_above\":\"リストするか、上記のログインを修正してください。\",\"loading\":\"読み込み中…\",\"main\":\"main\",\"min\":\"分\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"インシデントをチャネルにライブボードとしてミラーリング：インシデントごとに1つのメッセージで、\\n        状態は適切に更新され、診断はスレッド内にあります。\\n        {{productName}} が既に持っている Slack 接続を使用します — このアプリは Slack トークンを独自に保存しません。\",\"mirror_incidents_to_slack\":\"インシデントを Slack にミラーリング\",\"mode_act_label\":\"実行\",\"mode_help_act\":\"ルールで明示的にホワイトリストに登録したシグナルパターンのアクションを実行します。ルールはソースとリソースパターンに名前を付ける必要があります — 「すべて」ルールはありません。すべての実行が監査されます。\",\"mode_help_observe\":\"シグナルを読み取り、調査します。どのプロバイダーにも何も書き込みません。これはデフォルトで安全な開始場所です。\",\"mode_help_propose\":\"Observeが実行するすべてのもの、さらに確認応答/解決/コメントアクションをドラフトして、最初にあなたに尋ねます。承認されていないものは何も実行されません。\",\"mode_observe_label\":\"観察\",\"mode_propose_label\":\"提案\",\"needs_human_derived\":\"現在{{value}}、上記のウィンドウから派生しているため、それが移動するときに移動します。ここで設定するとピン留めします。\",\"needs_human_pinned\":\"{{value}}でピン留めされ、上記のウィンドウとは無関係です。\",\"needs_setup\":\"セットアップが必要\",\"new_claims_per_heartbeat\":\"ハートビートごとの新しい引き受け\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"次の同期は、その名前の別のブランチが既に存在しない限り、それ自体を移動します — その場合、どちらの履歴を保つかを選択するのを拒否し、上記のメッセージは実行するマージに名前を付けます。\",\"no_branch_detached_head\":\"ブランチなし(detached HEAD)\",\"no_credential_note\":\"入力する認証情報がありません：同期は{{gitCmd}}をあなたとして実行し、あなた自身のSSH鍵または認証情報ヘルパーを使用します。SSHリモート({{sshRemote}})を優先してください — トークンを含むURLを貼り付けないでください。このアプリの設定ファイルはサインインなしで読取可能だからです。デフォルトブランチの場合はブランチを空のままにしてください({{defaultBranch}})。\",\"no_github_login_resolved_for_this_instance_so_it\":\"このインスタンスの GitHub ログインが解決されないため、\\n                当番かどうかを判断することはできません。上記のいずれかを入力するか、\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"ルールがまだありません — 特定のリソースセットの権限を付与するには、下に1つ追加してください。\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"このゲートウェイによって報告されていないため、有効な値を表示することはできません。\",\"not_set\":\"未設定\",\"not_set_up\":\"セットアップされていない\",\"notify_me_on_state_changes\":\"ステート変更時に通知を受け取る\",\"off\":\"オフ\",\"on_call_schedule\":\"当番スケジュール\",\"one_notification_per_state_change_never_per_hear\":\"ステート変更ごとに1つの通知で、ハートビートごとではありません：\\n        ダウン状態が続くソースは2分ごとではなく1回報告されます。\\n        同じインシデントスタックの繰り返しは1行に集約されます。\",\"only_the_on_call_instance_picks_up_work\":\"当番のインスタンスのみが作業を受け取ります\",\"pagerduty_user_id_help\":\"PagerDutyが当番として報告する対象にマッチするため、このインスタンスはポケベルがあなたのものかどうかを判断できます。エージェントが到達できない場所に保存されます — スケジュール上の誰でもあなたとして扱うには空のままにしてください。\",\"incidentio_user_id_help\":\"incident.io のスケジュールに登録されているユーザーと照合するため、このインスタンスはそのシフトがあなたのものかどうかを判断できます。エージェントが到達できない場所に保存されます — スケジュール上の誰でもあなたとして扱うには空のままにしてください。 ID が設定されていてスケジュールが未設定の場合、このインスタンスはシフト外のままになります。\",\"identity_save_refused\":\"ID は保存されませんでした — 設定ストアが書き込みを拒否しました。もう一度お試しください。\",\"change_save_refused\":\"変更は保存されませんでした — 設定ストアが書き込みを拒否しました。もう一度お試しください。\",\"value_too_long_refused\":\"その値は長すぎるため保存されませんでした。\",\"prod_star\":\"prod-*\",\"providers\":\"プロバイダー\",\"pushes_stay_refused_until\":\"プッシュは以下まで拒否されたままです\",\"quiet_and_expires_on_its_own\":\"· 静か、そして自動的に期限切れ\",\"ready\":\"準備完了\",\"release_a_question_after\":\"質問をリリース\",\"release_an_investigation_after\":\"調査をリリース\",\"remote\":\"リモート\",\"replace\":\"置換\",\"repository\":\"リポジトリ\",\"resolved_from_the_gh_cli_when_blank\":\"空白の場合はgh CLIから解決されます\",\"resource_pattern\":\"リソースパターン\",\"revoke_rule\":\"ルールを取り消す\",\"revoke_stored_credentials\":\"保存された認証情報を取り消す\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"台帳ディレクトリで手動で実行してください。\\n          このブランチにはアップストリームがないからです。\",\"run_nightly_ledger_maintenance_on_this_instance\":\"このインスタンスで夜間台帳メンテナンスを実行\",\"save\":\"保存\",\"schedule_conflict\":\"スケジュールの競合\",\"schedule_location_note\":\"ここで選択するパスはありません：スケジュールは{{schedule}}で、上記のリポジトリの{{ledger}}の横にコミットされています。場所は意図的に固定されています。すべてのインスタンスが読み取るローテーションは、すべてのインスタンスが見る場所に存在する必要があるからです。\",\"share_the_knowledge_ledger_with_my_team\":\"知識台帳をチームと共有\",\"shared_team_memory\":\"共有チームメモリ\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"共有は上記でセットアップされていないため、スケジュールはこのマシンに存在するすべてのものであり、\\n            他の誰にも到達しません。\",\"signal_source\":\"シグナルソース\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"保存 — 置換する新しい値を入力\",\"strict_off_explanation\":\"スケジュールが当番かどうかを言うことができない場合、このインスタンスとは関係なく動作します — 他のインスタンスも同様に、2人のチームメートが同じアラートで行動することができます。ソロインストールの場合のみこれを優先してください。\",\"strict_on_explanation\":\"スケジュールが当番かどうかを言うことができない場合、このインスタンスは低下します。これはまさに1人のチームメートがアラートで作業していることを保つものです。\",\"syncing\":\"同期中\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"このインスタンスが実行できる最大。シグナルごとのルールはこれを狭くすることができ、\\n          広くすることはできません — Observeに残すことで、どのルールが存在していてもアプリを読み取り専用に保ちます。\",\"this_repo_is_on\":\"このリポジトリは\",\"to_silence_one_of_these_without_turning_the_rest\":\"これらの1つを沈黙させるには、残りをオフにすることなく — または音量を変更するには、\\n            設定 → 通知を使用してください。\\n            すべてのアプリチャネルがリストされています。最初にチャネルが発火した後に表示されます。\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"監視したいシステムをオンにします。AWS は既存の認証情報を使用します。鍵は保存されません。\\n          その他のプロバイダーのトークンは、エージェントが読み取ることができない場所に保管されます。\",\"unavailable_here\":\"ここでは利用できません\",\"when_a_state_changes\":\"状態が変わったとき\",\"who\":\"who\",\"wrong_local_branch\":\"ローカルブランチが間違っています\",\"your_github_login\":\"GitHub ログイン\",\"your_pagerduty_user_id\":\"PagerDuty ユーザーID\",\"your_incident_io_user_id\":\"incident.io ユーザーID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"チームの台帳はまだ交換中です。名前を同期します\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"このポーリングに含まれないシグナルは復旧と解釈できます。\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"すべてシェイプハッシュ上にあり、番号のみが異なるアラームをマージします。修正をそれに応じて検討してください。\",\"at_least_one_source_did_not_answer_this_poll\":\"少なくとも 1 つのソースがこのポーリングに応答しませんでした。\",\"claim\":\"引き受け\",\"claimed\":\"引き受け済み\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· プッシュで配信されるため、空のポーリングは意味がありません\",\"every_configured_source_answered\":\"設定されたすべてのソースが応答しました。\",\"everything_firing_already_has_an_incident\":\"現在発火しているすべてが既にインシデントを持っています。\",\"firing\":\"発火中\",\"firing_not_yet_claimed\":\"発火中、未引き受け\",\"inbound_webhook_queued_other\":\"{{count}} 件の受信 webhook シグナルが配信され、次のサイクルに取り込まれるのを待機中です。まだボード上にありません。\",\"inhibited_by_alert_go_look_at_that_alert\":\"{{by}} により抑制されています。より高いランクのアラームがこれをマスクしています。そのアラームを確認してください。\",\"inhibited_by_another_alert_masking_this_one\":\"別のアラームにより抑制されています。より高いランクのアラームがこれをマスクしています。\",\"last_poll\":\"最後のポーリング\",\"loading\":\"読み込み中…\",\"n_d_ago\":\"{{n}} 日前\",\"n_h_ago\":\"{{n}} 時間前\",\"n_ledger_entries_matched\":\"{{count}} 件の台帳エントリがマッチしました。{{detail}}\",\"n_m_ago\":\"{{n}} 分前\",\"n_on_own_identity_exact_match\":\"{{count}} 件がこのプロバイダーの独自の ID にあり、これは完全一致です。\",\"n_s_ago\":\"{{n}} 秒前\",\"n_signals_other\":\"{{count}} 件のシグナル\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} 件の類似レッスンがコンテキストとして添付されています。完全一致ではなく、ニアミスです。\",\"no_attribution_cannot_say_who_parked_it\":\"このプロバイダーが属性を公開していないため、誰が抑制したのか、いつ戻るのかを判断できません。\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"どのパターンもファストパスバーをクリアしなかったため、エージェントが提案する前に確認する必要があります。\",\"no_signal_source_is_configured_so_nothing_was_po\":\"シグナルソースが設定されていないため、何もポーリングされていません。\\n                まだ静かなボードに意味はありません。設定でソースを接続してください。\",\"no_signal_sources_registered\":\"登録されたシグナルソースがありません。\",\"no_sources_reporting_a_firing_signal\":\"発火シグナルを報告しているソースはありません。\",\"not_polled_yet_not_the_same_as_healthy\":\"まだポーリングされていません。これは健全であることと同じではありません\",\"nothing_firing_but_parked_signals_not_investigated\":\"何も発火していませんが、上記の抑制シグナルは調査されていません\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"何も発火していません。ただし、{{count}} 件のシグナルがプロバイダーに抑制されており（上記を参照）、取り込まれません。\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"台帳のどれもマッチしなかったため、調査をゼロから開始します。\",\"nothing_unclaimed\":\"未引き受けなし\",\"one_ledger_entry_matched\":\"1 件の台帳エントリがマッチしました。{{detail}}\",\"parked\":\"抑制中\",\"parked_2\":\"抑制済み\",\"parked_at_the_provider\":\"プロバイダーに抑制されています\",\"poll_answered\":\"応答\",\"poll_every_configured_source_now_read_only\":\"設定されたすべてのソースをポーリング（読み取り専用）\",\"poll_now\":\"今ポーリング\",\"poll_to_see_what_is_firing\":\"ポーリングして何が発火しているかを確認します。\",\"polling\":\"ポーリング中…\",\"proven_pattern_matched_agent_may_propose_directly\":\"実証済みのパターンがマッチしたため、エージェントが修正を直接提案できます。\",\"provider\":\"プロバイダー\",\"push_source_absence_note_other\":\"このポーリングに含まれないシグナルは復旧と解釈できます。ただし {{sources}} は除きます。これらはプッシュでスプールに配信され、各ポーリングが空にするため、既に配信されたシグナルは、まだ発火しているかどうかに関わらず再び表示されません。\",\"recovered\":\"復旧\",\"reported_recovered\":\"復旧報告済み\",\"signal_sources\":\"シグナルソース\",\"silenced_by_review_or_let_expire\":\"{{by}} により沈黙させられています。レビューするか、プロバイダーで沈黙を期限切れにしてください。\",\"someone_silenced_these_where_they_came_from_so_t\":\"誰かがこれらが来た場所で沈黙させたため、調査されておらず、\\n            インシデントは開かれていません。「人が抑制した」と\\n            「アプリが無視した」を区別するため、リストに表示されます。\",\"source\":\"ソース\",\"sources_did_not_answer_this_poll\":\"{{sources}} がこのポーリングに応答しませんでした。\",\"spool_full_note\":\"スプールが {{limit}} で満杯のため、新しい配信が到着するときに最古の配信が破棄されます。ボードからサイクルを実行してください（「ポーリング＆引き受け」）。\",\"state\":\"状態\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"ハートビートは 1 サイクルに数件ずつ取得するため、急増時にはキューが残ります。\\n          待たずに調査を開始するには、今すぐ 1 件取得してください。\",\"the_provider_said_these_are_back_to_normal_unlik\":\"プロバイダーは、これらが正常に戻ったと報告しました。\\n            単に表示されなくなったシグナルとは異なり、これは解決の根拠になります。\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"このソースはスプールにプッシュし、各ポーリングが空にするため、既に配信したシグナルは、障害がまだ生きていても再び表示されません。\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"作業の出所。設定で認証情報とスコープを構成します。\\n          ここでソースが実際に何を返すかを確認するようにポーリングします。\",\"while_that_is_true_absence_of_a_signal_does_not\":\"これが真の場合でも、シグナルの不在は復旧を意味しません。単に\\n                見ることができなかっただけかもしれません。\",\"firing_count_other\":\"{{count}} 件発火中 ·\",\"parked_count_other\":\"{{count}} 件プロバイダーに抑制 ·\",\"cleared_count_other\":\"{{count}} 件クリア済み ·\",\"unclaimed_count_other\":\"{{count}} 件未引き受け\"}}}") },
	ko: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"백오프 중\",\"source_health_failed\":\"실패\",\"source_health_not_polled_yet\":\"아직 폴링하지 않음\",\"source_health_not_set_up\":\"설정되지 않음\",\"the_last_poll_failed\":\"마지막 폴링이 실패했습니다.\",\"verification_confirmed_label\":\"확인됨\",\"verification_confirmed_meaning\":\"{{verb}} 이후 응답한 소스를 대상으로 신호를 다시 읽었으며, 더 이상 발생하지 않습니다.\",\"verification_could_not_check_label\":\"확인할 수 없음\",\"verification_could_not_check_meaning\":\"재확인 시점이 되었으나 소스가 응답하지 않았으므로 어느 쪽도 입증하지 못합니다. 이후 주기에서 자동으로 다시 시도합니다.\",\"verification_not_checkable_label\":\"전송됨, 미확인\",\"verification_not_checkable_meaning\":\"{{verb}}은(는) 수락되었지만 이 앱은 효과가 있었는지 관찰할 수 없습니다. 확인 응답은 설계상 알림을 계속 발생 상태로 두므로, 알람 상태는 어느 쪽도 알려주지 않습니다.\",\"verification_pending_label\":\"아직 확인되지 않음\",\"verification_pending_meaning\":\"{{verb}}이(가) 성공을 반환했으며, 이는 공급자가 요청을 수락했다는 뜻일 뿐입니다. 다음 하트비트가 신호를 다시 읽어 효과가 있었는지 확인합니다.\",\"verification_pending_meaning_at\":\"{{verb}}이(가) 성공을 반환했으며, 이는 공급자가 요청을 수락했다는 뜻일 뿐입니다. {{when}} 이후의 다음 하트비트가 신호를 다시 읽어 효과가 있었는지 확인합니다.\",\"verification_still_firing_label\":\"이 작업 후에도 발생 중\",\"verification_still_firing_meaning\":\"공급자가 {{verb}}을(를) 수락했지만 다시 확인했을 때 신호는 여전히 발생 중이었습니다. 이 건을 연 원인이 된 조건이 지금도 유효합니다.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"같은 장애가 두 번 일치하면 패턴이 여기에 표시됩니다 — 한 번의 발생은 패턴이 아니라 인시던트입니다.\",\"applied_and_the_signal_kept_firing_afterwards\":\"적용되었으나 이후에도 신호가 계속 발생했습니다\",\"at_least_one_source_did_not_answer_the_last_poll\":\"최소 한 개의 소스가 마지막 폴링에 응답하지 않았습니다.\",\"building_the_digest\":\"요약 작성 중…\",\"claimed_by_hand\":\"수동으로 인수됨\",\"claimed_by_hand_not_the_heartbeat\":\"하트비트가 아니라 수동으로 인수됨\",\"copied\":\"복사됨\",\"copy_as_text\":\"텍스트로 복사\",\"copy_the_digest_as_text_for_a_handover_thread\":\"인계 스레드용으로 요약을 텍스트로 복사\",\"coverage\":\"커버리지\",\"derived_from_configuration_only_no_source_has_be\":\"설정만으로 도출됨 — 이 세션에서 폴링된 소스가 없으므로\\n 이는 어느 소스가 응답한다는 증거가 아닙니다. 신호 탭에서 폴링하세요.\",\"escalated_to_someone_else\":\"다른 담당자로 에스컬레이션됨\",\"every_configured_source_answered_the_last_poll\":\"설정된 모든 소스가 마지막 폴링에 응답했습니다.\",\"failed\":\"실패\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"다른 담당자에게 인계되어 더 이상 이 앱의 작업이 아닙니다 — 다만\\n 이를 챙겨야 하는 사람은 여전히 본인일 수 있습니다.\",\"handover\":\"인계\",\"no_recurring_patterns_yet\":\"아직 반복 패턴 없음\",\"not_configured_blind_spots\":\"설정되지 않음(사각지대): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"감시 중인 대상이 없으므로 조용한 보드는 아무 의미가 없습니다. 설정에서\\n 소스를 연결하세요.\",\"pattern_proven\":\"입증됨\",\"refresh\":\"새로 고침\",\"refreshing\":\"새로 고치는 중…\",\"source_not_answering\":\"{{name}}(응답 없음)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}}이(가) 마지막 폴링에 응답하지 않았습니다.\",\"stopped_with_no_diagnosis\":\"진단 없이 중단됨\",\"the_investigation_ended_without_recording_anythi\":\"조사가 아무것도 기록하지 않고 종료되어 이어받을 스레드가 없습니다.\\n 답변하는 것이 아니라 다시 시작해야 합니다.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"이들은 스스로 진행되지 않습니다 — 지난 교대에서 답변되지 않은 질문이\\n 이번 교대의 첫 번째 업무입니다.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"이 수정이 적용되었으나 이후에도 신호가 발생 중이었습니다. 이를\\n 정답으로 인계하지 마세요 — 이미 시도한 내용을 말하세요.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"그 문제가 해결되기 전까지 조용한 보드는 복구의 증거가 아닙니다.\",\"waiting_on_you\":\"사용자 대기 중\",\"watching_nothing\":\"감시 중: 없음\",\"watching_sources\":\"감시 중: {{sources}}\",\"what_keeps_happening\":\"반복되는 문제\"},\"incidentChat\":{\"ask_about_incident\":\"{{incidentId}}에 대해 질문…\",\"live_investigation_header\":\"{{incident}}{{title}}의 실시간 조사입니다. 에이전트에게 답하거나 방향을 잡으려면 여기에 회신하세요.\"},\"manifest\":{\"use_case_1\":\"운영 신호를 감시하고, 인시던트를 조사하고, 검증된 수정 방법을 재사용하며, 완전한 로컬 감사 기록을 인계합니다.\",\"configuration_1\":\"설정에서 환경 자격 증명 또는 제공자 토큰으로 제공자를 추가하세요. 읽기 전용으로 사용하려면 Observe를 유지하고, 허용할 Propose 또는 Act 작업은 명시적으로 활성화하세요. Slack 출력은 기존 Kiro Crew 연결을 재사용합니다.\",\"description\":\"자율 운영 초동 대응자입니다. 알람, 페이지, 모니터를 감시하고 발생한 것을 인수하며, 실제 컨텍스트로 조사하고 수정을 제안합니다. 학습한 모든 내용을 로컬 원장에 보관하므로 두 번째 발생은 첫 번째보다 빠릅니다.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"발생한 알람을 하트비트 한 번 안에 인수하고 누군가 확인해야 하기 전에 조사합니다\",\"highlight_2\":\"신뢰도와 신뢰 수준을 갖춘 지식 원장 — 반복되는 장애는 이미 알고 있는 내용으로 해결됩니다\",\"highlight_3\":\"대시보드의 실시간 보드와 회신 가능한 Slack 스레드 — 채널이 곧 대시보드입니다\",\"highlight_4\":\"AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues 또는 서명된 JSON을 POST할 수 있는 모든 시스템에 연결 — Alertmanager 형태의 본문도 포함하며 알림당 인시던트 하나로 팬아웃합니다\",\"highlight_5\":\"기본은 읽기 전용 — 쓰기 작업은 신호 패턴별 옵트인이며 모두 감사됩니다\",\"highlight_6\":\"교대 인식: 근무 중 자동화 계층이 스스로 활성화되고 해제됩니다\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"실행\",\"active\":\"활성\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — 누구나 그 두 값을 기록할 수\\n 있으므로 빠른 경로에는 다음도 필요합니다\",\"approve_and_run\":\"승인 후 실행\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"최소 한 개의 소스가 마지막 폴링에 응답하지 않았으므로 신호가 없다는 것이 복구를 뜻하지는 않습니다.\",\"autonomous_first_responder_for_your_alarms_pages\":\"알람, 페이지, 모니터를 위한 자율 초동 대응자\",\"awaiting_your_approval\":\"승인 대기 중\",\"board\":\"보드\",\"claiming\":\"인수 중…\",\"closed_postmortems\":\"종료됨 — 사후 분석\",\"confidence\":\"신뢰도\",\"confidence_2\":\"신뢰도\",\"connect_a_provider_in_settings_to_start_watching\":\"감시를 시작하려면 설정에서 공급자를 연결하세요.\",\"copied\":\"복사됨\",\"copy_postmortem\":\"사후 분석 복사\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"티켓이나 리뷰용으로 사후 분석을 작성된 그대로 복사\",\"demoted\":\"강등됨\",\"demoted_note\":\"강등됨: 이 수정이 적용되었으나 이후에도 신호가 발생 중이었습니다{{recent}}. 때때로 통하는 수정이 없는 것보다 낫기 때문에 보관하지만, 정답이 아니라 이미 시도한 것으로 취급하세요.\",\"demoted_refuted_summary_plural\":\"전체 {{total}}개 항목 중 {{demoted}}개가 반증되었습니다 — 수정이 적용되었으나 신호가 계속 발생했습니다. 위 {{rows}}개 행에 모두 포함되어 있지 않을 수 있습니다.\",\"demoted_refuted_summary_singular\":\"전체 {{total}}개 항목 중 {{demoted}}개가 반증되었습니다 — 수정이 적용되었으나 신호가 계속 발생했습니다. 위 {{rows}}개 행에 모두 포함되어 있지 않을 수 있습니다.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"작업 초안을 작성하고 질문합니다 — 승인 없이는 아무것도 실행되지 않습니다\",\"empty_each_investigation_that_finds_a_reusable_f\":\"비어 있습니다. 재사용 가능한 수정을 찾은 각 조사가 여기에 기록하므로\\n 반복되는 장애는 이미 알고 있는 내용으로 해결됩니다.\",\"every_configured_source_answered_the_last_poll_s\":\"설정된 모든 소스가 마지막 폴링에 응답했으므로 이 조용함은 진짜입니다.\",\"executes_actions_granted_by_your_rules_every_one\":\"규칙이 허용한 작업을 실행합니다 — 모두 감사됩니다\",\"expand_the_row_below_for_what_was_attempted_the\":\"시도된 내용은 아래 행을 펼쳐 확인하세요. 인용된 원장 항목은\\n 실패한 것으로 표시되었습니다.\",\"expires_at_time\":\"{{time}}에 만료\",\"failed\":\"실패\",\"failed_2\":\"실패\",\"fast_path\":\"빠른 경로\",\"fix_label\":\"수정: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"가설 — 에이전트가 먼저 확인해야 합니다\",\"is_no_longer_in_the_ledger\":\"더 이상\\n 원장에 없습니다.\",\"knowledge_ledger\":\"지식 원장\",\"known_patterns\":\"알려진 패턴\",\"leader\":\"리더\",\"ledger_entry_locked\":\"잠김\",\"ledger_entry_unlocked\":\"잠금 해제됨\",\"loading\":\"불러오는 중…\",\"mark_resolved\":\"해결됨으로 표시\",\"marked_verified_and_high_confidence_but_used_onl\":\"검증됨 및 높은 신뢰도로 표시되었으나 사용 횟수는\",\"match_basis\":\"일치 기준\",\"match_basis_exact\":\"{{source}}은(는) 이 장애에 대한 정확한 식별자({{key}})를 게시하며, 원장은 우리의 형태 해시보다 이것을 우선합니다.\",\"matched_entry\":\"일치한 항목\",\"member_is_this_instance\":\"{{login}}(이 인스턴스)\",\"mission_control\":\"Mission Control\",\"mode\":\"모드\",\"n_matched\":\"{{count}}개 일치\",\"no_diagnosis_recorded_yet\":\"아직 기록된 진단이 없습니다.\",\"no_github_login_resolved_for_this_instance_so_it\":\"이 인스턴스의 GitHub 로그인이 확인되지 않아 당번인지 판단할 수\\n 없습니다. 스케줄 파일 공급자의 github_login을 설정하거나\\n gh CLI를 인증하세요.\",\"no_incidents_claimed\":\"인수된 인시던트 없음\",\"no_postmortem_was_written_for_this_incident_inci\":\"이 인시던트에 대한 사후 분석이 작성되지 않았습니다. 사후 분석이 작성되기 전에\\n 종료된 인시던트에는 사후 분석이 없으며, 어떤 것도 소급 생성하지 않습니다 — 기록을\\n 새로 만들어내야 합니다.\",\"no_providers_set_up_open_settings_to_connect_one\":\"아직 설정된 공급자가 없습니다 — 설정을 열어 연결하세요.\",\"no_source_configured_nothing_polled_connect_one\":\"설정된 소스가 없어 아무것도 폴링되지 않았습니다. 설정에서 공급자를 연결하세요.\",\"none_matched\":\"일치 없음\",\"not_on_roster_lenient\":\"이 인스턴스({{me}})는 스케줄에 이름이 없습니다. 엄격한 게이팅이 꺼져 있어 계속 작업을 가져갑니다 — 즉 어떤 팀원도 기다리지 않습니다. 교대가 결정하도록 하려면 who: 목록에 추가하세요.\",\"not_on_roster_strict\":\"이 인스턴스({{me}})는 스케줄에 이름이 없으므로 엄격한 게이팅에서는 절대 작업을 가져가지 않습니다. rotation.yaml의 who: 목록에 추가하거나 설정에서 GitHub 로그인을 수정하세요.\",\"nothing_claimed_but_the_board_is_not_verified\":\"인수된 것 없음 — 다만 보드는 검증되지 않았습니다\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"아직 종료된 것이 없습니다. 인시던트가 해결되거나 에스컬레이션되면 사후 분석이\\n 여기에 작성됩니다 — 인시던트당 Markdown 파일 하나로, 티켓에 첨부하거나\\n 동료에게 전달할 수 있는 형식입니다.\",\"nothing_is_firing\":\"발생 중인 것 없음\",\"observe\":\"관찰\",\"off_shift\":\"비근무\",\"off_shift_who_is_on_call\":\"비근무 — {{who}}이(가) 당번{{until}}\",\"on_call_now\":\"현재 당번\",\"on_call_team\":\"당번 팀\",\"on_shift\":\"근무 중{{until}}\",\"on_shift_who\":\"근무 중: {{who}}{{until}}\",\"open_in_provider\":\"공급자에서 열기\",\"pattern\":\"패턴\",\"patterns_known\":\"알려진 패턴\",\"patterns_proven\":\"입증된 패턴\",\"poll_and_claim\":\"폴링 및 인수\",\"poll_every_configured_source_now_and_claim_anyth\":\"지금 설정된 모든 소스를 폴링하고 새로운 것을 인수\",\"polled_summary_other\":\"발생 중인 신호 {{polled}}개를 폴링했습니다. 새로 인수할 것은 없습니다.\",\"polled_summary_with_parked_other\":\"발생 중인 신호 {{polled}}개를 폴링했고, 공급자에 보류되어 그대로 둔 {{suppressed}}개가 추가로 있습니다. 새로 인수할 것은 없습니다.\",\"propose\":\"제안\",\"proven_agent_may_propose_directly\":\"입증됨 — 에이전트가 바로 제안할 수 있습니다\",\"read_only_nothing_is_written_to_any_provider\":\"읽기 전용 — 어떤 공급자에도 쓰지 않습니다\",\"reading_the_postmortem\":\"사후 분석을 읽는 중…\",\"reject\":\"거부\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Slack 스레드의 회신은 이 조사에 전달됩니다.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Slack 스레드의 회신은 이 조사에 전달되지 않습니다 —\\n 대신 아래 채팅에서 답하세요.\",\"resource\":\"리소스\",\"rotation_unknown_not_picking_up_work\":\"교대 알 수 없음 — 작업을 가져가지 않습니다\",\"rotation_unknown_tier_armed\":\"교대 알 수 없음 — 계층 활성화됨\",\"runs_nightly_ledger_hygiene_for_the_team\":\"팀을 위해 야간 원장 정리를 실행합니다\",\"schedule_problem\":\"스케줄 문제: {{error}}\",\"sent\":\"전송됨\",\"sent_n_ago\":\"{{age}} 전에 전송\",\"shift_other\":\"{{count}}개 교대\",\"showing_closed_incidents_other\":\"최근 기간에 종료된 인시던트 {{count}}건 표시\",\"showing_n_of_total\":\"{{total}}개 중 {{shown}}개 — 이전 항목은 디스크에 있지만 이 목록에는 없습니다\",\"source\":\"소스\",\"source_health_not_verified_poll_from_signals_tab\":\"이 세션에서 소스 상태가 검증되지 않았습니다 — 조용함이 진짜인지 확인하려면 신호 탭에서 폴링하세요.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}}이(가) 마지막 폴링에 응답하지 않았으므로 신호가 없다는 것이 복구를 뜻하지는 않습니다.\",\"sources_wired\":\"연결된 소스\",\"status_dispatched\":\"디스패치됨\",\"status_escalated\":\"에스컬레이션됨\",\"status_investigating\":\"조사 중\",\"status_needs_human\":\"사람 필요\",\"status_resolved\":\"해결됨\",\"status_stale\":\"오래됨\",\"status_unclaimed\":\"미인수\",\"tab_board\":\"보드\",\"tab_handover\":\"인계\",\"tab_settings\":\"설정\",\"tab_signals\":\"신호\",\"the_decision_was_refused\":\"결정이 거부되었습니다.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"이 수정이 적용되었으나 신호가 계속 발생했습니다\",\"this_provider_published_no_exact_identity_so_any\":\"이 공급자는 정확한 식별자를 게시하지 않으므로 모든 원장 일치는\\n 우리의 형태 해시입니다 — 한 리소스의 4xx와 5xx 비율처럼\\n 숫자만 다른 알람을 병합하는 휴리스틱입니다.\\n 기억된 수정은 그에 맞게 판단하세요.\",\"through_sink\":\"{{sink}}을(를) 통해\",\"through_sink_for_duration\":\"{{sink}}을(를) 통해 {{duration}} 동안\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · 당번 인스턴스만 작업을 가져갑니다\",\"trust\":\"신뢰\",\"unlocked_means_an_investigation_may_propose_this\":\"‘잠금 해제됨’은 조사가 이 수정을 다시 도출하지 않고 바로 제안할 수\\n 있다는 뜻입니다 — 이를 위해서는 검증된 신뢰, 높은\\n 신뢰도, 그리고 최소\",\"until_shift_end\":\"{{end}}까지\",\"used\":\"사용됨\",\"used_2\":\"사용됨\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"회 사용, 그리고 기록된 실패 없음, 이 네 가지가 모두 필요합니다.\\n 잠긴 항목도 여전히 에이전트에게 전체가 전달되며, 먼저 확인하라는 지시를\\n 받습니다. 강등된 항목은 시도했으나 신호가 계속 발생한 것으로, 검증되지 않은\\n 추측보다 더 강한 경고입니다.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"회 사용해야 에이전트가 확인 없이\\n 제안합니다.\",\"verification_failed_many\":\"이 앱이 적용되었다고 보고한 작업({{ids}}) 이후 다시 읽었을 때 인시던트 {{count}}건이 여전히 발생 중이었습니다.\",\"verification_failed_one\":\"{{id}}은(는) 이 앱이 적용되었다고 보고한 작업 이후 다시 읽었을 때에도 여전히 발생 중이었습니다.\",\"waiting_awaiting_approval\":\"계속하려면 승인하세요\",\"waiting_awaiting_diagnosis\":\"중단됨, 진단 없음\",\"waiting_awaiting_input\":\"사용자 대기 중\",\"waiting_on_you\":\"사용자 대기 중\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"패턴은 필수입니다 — 와일드카드 허용은 없습니다. 접두사를 일치시키려면 *를 사용하세요. 예를 들어 prod-*는 이름이 prod-로 시작하는 모든 리소스를 포함합니다.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act에는 위의 모드와 신호에 일치하는 규칙이 모두 필요합니다. 모드만으로는 아무것도 허용되지 않습니다.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act는 작성한 규칙에 일치하는 신호에만 적용됩니다. 규칙이 없으면\\n Propose처럼 동작합니다.\",\"act_rules\":\"Act 규칙\",\"active\":\"활성\",\"all_actions\":\"모든 작업\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"사용자를 기다리는 인시던트에는 더 긴 시간이 주어집니다 — 잠들어 있는 것은\\n 에이전트가 죽은 것과 다릅니다.\",\"autonomy\":\"자율성\",\"branch\":\"브랜치\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"채널 ID\",\"channel_when_incident_released\":\"유휴 조사가 재인수를 위해 해제될 때 발생합니다.\",\"channel_when_source_health\":\"소스가 응답을 멈춘 폴링에서 발생합니다 — 계속 다운된 동안에는 다시 발생하지 않습니다.\",\"channel_when_waiting_on_you\":\"인시던트가 사람을 기다리기 시작하는 순간 발생합니다.\",\"choose_a_source\":\"소스 선택\",\"cli\":\"CLI.\",\"companions_installed_other\":\"어댑터 패키지 {{count}}개가 설치되었습니다: {{names}}. 허용되면 해당 소스가 위 목록에 나타납니다. 나타나지 않으면 플릿 허용 정책이 거부한 것입니다 — 게이트웨이 로그를 확인하세요.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"먼저 신호 소스를 연결하세요 — 설정되지 않은 공급자를 지정한 규칙은 절대 일치할 수 없습니다.\",\"credential_retention_note\":\"앱 폴더 밖에 저장되므로 에이전트가 읽을 수 없습니다. 참고: 이 앱을 제거해도 삭제되지 않습니다. 자격 증명을 없애려면 여기서 먼저 취소하세요.\",\"desktop_notifications\":\"데스크톱 알림\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEAD는 의도적으로 그대로 둡니다. 진행 중인 병합이나 리베이스를 먼저 완료하거나 중단하세요. 그 아래에서 refs를 옮기면 해당 작업을 잃을 수 있습니다.\",\"enable_provider\":\"{{provider}} 사용\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"교환은 야간 유지 관리 과정에서만 이루어지며 인시던트마다 하지 않습니다. ‘야간 원장\\n 유지 관리’가 켜져 있는 인스턴스에서 실행되므로(아래 인스턴스 참조),\\n 그 설정이 꺼진 인스턴스는 절대 가져오지 않습니다. 이미 보유한 사본으로 동작하며,\\n 여기에는 마지막으로 확인한\",\"expected_shape_label\":\"예상 형태\",\"explicitly_every_time_what_does_not_work_is\":\"매번 명시적으로 지정합니다.\\n 동작하지 않는 것은\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Slack의 채널 상세 대화상자 하단에서 찾을 수 있습니다. 먼저\\n {{productName}} 봇을 채널에 초대하세요. 그렇지 않으면 게시가 실패합니다.\",\"get_a_notification_when_something_changes_that_n\":\"대응이 필요한 변화가 생기면 알림을 받습니다 — Slack 워크스페이스도,\\n 어떤 자격 증명도 필요하지 않습니다. {{productName}}의 알림 센터와\\n 데스크톱으로 전달됩니다.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"이 인스턴스가 {{whoKey}}에서 자신을 인식하는 방식입니다. 로컬 {{ghCli}} CLI가 인증된 로그인을 사용하려면 비워 두세요.\",\"grant\":\"허용\",\"heartbeat_pacing\":\"하트비트 속도\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"하트비트가 한 번에 가져가는 양과 작업을 되돌려주기까지 기다리는 시간입니다.\\n 인시던트를 해제해도 해결되지는 않습니다 — 신호를 다시 인수할 수 있게 되므로\\n 에이전트가 죽은 조사는 알람을 영원히 붙잡아 두는 대신\\n 다시 시도됩니다.\",\"in_force_now\":\"현재 적용 중\",\"instance\":\"인스턴스\",\"interrupts_by_default\":\"· 기본적으로 방해함\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"어떤 교대에도 이름이 없고\\n 엄격한 게이팅이 꺼져 있습니다 — 따라서 이 인스턴스는 스케줄과 무관하게 작업을\\n 가져가고, 당번인 사람에게 양보하지 않습니다. 교대가 대응자를 결정하도록 하려면 다음\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"어떤 교대에도 이름이 없으므로\\n 엄격한 게이팅에서는 이 인스턴스가 절대 작업을 가져가지 않습니다. 다음\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"이(가)\\n 저장소에서 수동으로 해결될 때까지 계속 거부됩니다 — 충돌 마커로 가득한 스케줄을 게시하면\\n 모든 팀원이 누가 당번인지 파싱할 수 없게 됩니다.\",\"it_last_saw\":\"마지막으로 확인한\\n 사본도 포함됩니다.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Ops Mission Control을 실행하는 사람이 본인뿐이라면 이 설정을 켜 두세요. 원장 하나를\\n 공유하는 팀에서는 정확히 한 인스턴스만 주 인스턴스여야 하며, 그래야 유지 관리\\n 과정이 사람마다 한 번씩 실행되지 않습니다.\",\"ledger_conflict\":\"원장 충돌\",\"ledger_intro\":\"일반 git 저장소를 통해 교환되는 팀의 지식 원장입니다. {{file}}은(는) 야간 유지 관리 과정에서 가져오고 푸시합니다.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"목록에\\n 추가하세요.\",\"list_or_correct_the_login_above\":\"목록에 추가하거나 위의 로그인을 수정하세요.\",\"loading\":\"불러오는 중…\",\"main\":\"main\",\"min\":\"분\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"인시던트를 실시간 보드로 채널에 미러링합니다. 인시던트당 메시지 하나이며 상태가\\n 그 자리에서 갱신되고 진단은 스레드에 담깁니다. {{productName}}이(가) 이미 보유한 Slack\\n 연결을 사용하므로 이 앱은 자체 Slack 토큰을 저장하지 않습니다.\",\"mirror_incidents_to_slack\":\"인시던트를 Slack에 미러링\",\"mode_act_label\":\"실행\",\"mode_help_act\":\"규칙으로 명시적으로 허용 목록에 넣은 신호 패턴에 대해 작업을 실행합니다. 규칙은 소스와 리소스 패턴을 지정해야 하며 ‘모든 것’ 규칙은 없습니다. 모든 실행은 감사됩니다.\",\"mode_help_observe\":\"신호를 읽고 조사합니다. 어떤 공급자에도 쓰지 않습니다. 기본값이며 안전하게 시작할 수 있는 지점입니다.\",\"mode_help_propose\":\"Observe가 하는 모든 것에 더해, 확인·해결·댓글 작업의 초안을 작성하고 먼저 사용자에게 묻습니다. 승인 없이는 아무것도 실행되지 않습니다.\",\"mode_observe_label\":\"관찰\",\"mode_propose_label\":\"제안\",\"needs_human_derived\":\"현재 {{value}}이며 위의 시간 범위에서 도출되므로 그것이 바뀌면 함께 바뀝니다. 여기서 설정하면 고정됩니다.\",\"needs_human_pinned\":\"{{value}}(으)로 고정되어 위의 시간 범위와 무관합니다.\",\"needs_setup\":\"설정 필요\",\"new_claims_per_heartbeat\":\"하트비트당 새 인수\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"다음 동기화가 알아서 옮기지만, 같은 이름의 다른 브랜치가 이미 있으면 어느 히스토리를 남길지 고르는 대신 거부하며, 위의 메시지가 실행할 병합을 알려줍니다.\",\"no_branch_detached_head\":\"브랜치 없음(detached HEAD)\",\"no_credential_note\":\"입력할 자격 증명이 없습니다. 동기화는 {{gitCmd}}을(를) 사용자 권한으로 실행하며 사용자의 SSH 키나 자격 증명 헬퍼를 사용합니다. SSH 리모트({{sshRemote}})를 권장합니다 — 토큰이 포함된 URL은 절대 붙여넣지 마세요. 이 앱의 설정 파일은 로그인 없이 읽을 수 있습니다. {{defaultBranch}}을(를) 사용하려면 브랜치를 비워 두세요.\",\"no_github_login_resolved_for_this_instance_so_it\":\"이 인스턴스의 GitHub 로그인이 확인되지 않아 당번인지 판단할 수\\n 없습니다. 위에 입력하거나 다음을 인증하세요:\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"아직 규칙이 없습니다 — 특정 리소스 집합에 권한을 부여하려면 아래에 하나 추가하세요.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"이 게이트웨이가 보고하지 않으므로 적용 중인 값을 표시할 수 없습니다.\",\"not_set\":\"설정되지 않음\",\"not_set_up\":\"설정되지 않음\",\"notify_me_on_state_changes\":\"상태 변경 시 알림 받기\",\"off\":\"꺼짐\",\"on_call_schedule\":\"당번 스케줄\",\"one_notification_per_state_change_never_per_hear\":\"상태 변경마다 알림 하나이며 하트비트마다가 아닙니다. 계속 다운된 소스는\\n 2분마다가 아니라 한 번만 보고됩니다. 같은 인시던트의 반복은 한 행으로\\n 쌓입니다.\",\"only_the_on_call_instance_picks_up_work\":\"당번 인스턴스만 작업을 가져갑니다\",\"pagerduty_user_id_help\":\"PagerDuty가 당번으로 보고하는 대상과 대조되므로 이 인스턴스가 그 호출이 사용자의 것인지 판단할 수 있습니다. 에이전트가 접근할 수 없는 곳에 저장됩니다 — 스케줄에 있는 누구나 사용자로 취급하려면 비워 두세요.\",\"incidentio_user_id_help\":\"incident.io 일정에 있는 사용자와 대조되므로 이 인스턴스가 해당 근무가 사용자의 것인지 판단할 수 있습니다. 에이전트가 접근할 수 없는 곳에 저장됩니다 — 일정에 있는 누구나 사용자로 취급하려면 비워 두세요. ID가 설정되어 있지만 일정이 구성되지 않은 경우 이 인스턴스는 근무 외 상태로 유지됩니다.\",\"identity_save_refused\":\"ID가 저장되지 않았습니다 — 설정 저장소가 쓰기를 거부했습니다. 다시 시도하세요.\",\"change_save_refused\":\"변경 사항이 저장되지 않았습니다 — 설정 저장소가 쓰기를 거부했습니다. 다시 시도하세요.\",\"value_too_long_refused\":\"값이 너무 길어 저장되지 않았습니다.\",\"prod_star\":\"prod-*\",\"providers\":\"공급자\",\"pushes_stay_refused_until\":\"푸시는\",\"quiet_and_expires_on_its_own\":\"· 조용하며 스스로 만료됨\",\"ready\":\"준비됨\",\"release_a_question_after\":\"질문 해제 시간\",\"release_an_investigation_after\":\"조사 해제 시간\",\"remote\":\"리모트\",\"replace\":\"교체\",\"repository\":\"저장소\",\"resolved_from_the_gh_cli_when_blank\":\"비워 두면 gh CLI에서 확인됩니다\",\"resource_pattern\":\"리소스 패턴\",\"revoke_rule\":\"규칙 취소\",\"revoke_stored_credentials\":\"저장된 자격 증명 취소\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"원장 디렉터리에서 수동으로 실행하세요.\\n 이 브랜치에는 업스트림이 없기 때문입니다.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"이 인스턴스에서 야간 원장 유지 관리 실행\",\"save\":\"저장\",\"schedule_conflict\":\"스케줄 충돌\",\"schedule_location_note\":\"여기서 고를 경로는 없습니다. 스케줄은 {{schedule}}(으)로, 위의 저장소에 {{ledger}} 옆에 커밋됩니다. 위치는 의도적으로 고정되어 있습니다. 모든 인스턴스가 읽는 교대는 모든 인스턴스가 보는 곳에 있어야 하기 때문입니다.\",\"share_the_knowledge_ledger_with_my_team\":\"지식 원장을 팀과 공유\",\"shared_team_memory\":\"공유 팀 메모리\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"위에서 공유가 설정되지 않았으므로 스케줄은 이 컴퓨터에만 존재하며\\n 다른 누구에게도 전달되지 않습니다.\",\"signal_source\":\"신호 소스\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"저장됨 — 교체할 새 값을 입력하세요\",\"strict_off_explanation\":\"스케줄이 당번 여부를 알려주지 못할 때 이 인스턴스는 그래도 작동하며 — 다른 모든 인스턴스도 그렇게 하므로 팀원 두 명이 같은 알림에 대응할 수 있습니다. 단독 설치에서만 권장합니다.\",\"strict_on_explanation\":\"스케줄이 당번 여부를 알려주지 못할 때 이 인스턴스는 물러납니다. 그래야 정확히 한 명의 팀원만 알림을 처리합니다.\",\"syncing\":\"동기화 중\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"이 인스턴스가 할 수 있는 최대치입니다. 신호별 규칙은 이를 좁힐 수 있을 뿐 넓힐 수는\\n 없습니다 — 따라서 Observe로 두면 어떤 규칙이 있어도 앱은 읽기 전용으로 유지됩니다.\",\"this_repo_is_on\":\"이 저장소의 현재 브랜치:\",\"to_silence_one_of_these_without_turning_the_rest\":\"나머지를 끄지 않고 이 중 하나만 끄려면 — 또는 얼마나 강하게 방해할지\\n 바꾸려면 — 설정 → 알림을 사용하세요. 모든 앱 채널이 여기에\\n 나열됩니다. 채널은 처음 발생한 후에 표시됩니다.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"감시할 시스템을 켜세요. AWS는 기존 자격 증명을 사용하며 키는 저장되지\\n 않습니다. 다른 공급자의 토큰은 에이전트가 읽을 수 없는 곳에 보관됩니다.\",\"unavailable_here\":\"여기서는 사용할 수 없음\",\"when_a_state_changes\":\"상태가 변경될 때\",\"who\":\"who\",\"wrong_local_branch\":\"잘못된 로컬 브랜치\",\"your_github_login\":\"GitHub 로그인\",\"your_pagerduty_user_id\":\"PagerDuty 사용자 ID\",\"your_incident_io_user_id\":\"incident.io 사용자 ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"팀의 원장이 아직 교환 중입니다 — 동기화가 지정하는 이름:\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"이 폴링에 없는 신호는 복구된 것으로 읽을 수 있습니다.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"모두 우리의 형태 해시 기준이며, 이는 숫자만 다른 알람을 병합합니다. 기억된 수정은 그에 맞게 판단하세요.\",\"at_least_one_source_did_not_answer_this_poll\":\"최소 한 개의 소스가 이 폴링에 응답하지 않았습니다.\",\"claim\":\"인수\",\"claimed\":\"인수됨\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· 푸시로 전달되므로 빈 폴링은 아무 의미가 없습니다\",\"every_configured_source_answered\":\"설정된 모든 소스가 응답했습니다.\",\"everything_firing_already_has_an_incident\":\"현재 발생 중인 모든 것에 이미 인시던트가 있습니다.\",\"firing\":\"발생 중\",\"firing_not_yet_claimed\":\"발생 중, 아직 미인수\",\"inbound_webhook_queued_other\":\"수신 webhook 신호 {{count}}건이 전달되어 다음 주기가 가져가기를 기다리고 있습니다 — 아직 보드에 없습니다.\",\"inhibited_by_alert_go_look_at_that_alert\":\"{{by}}에 의해 억제되었습니다 — 더 높은 순위의 알림이 이것을 가리고 있습니다. 그 알림을 확인하세요.\",\"inhibited_by_another_alert_masking_this_one\":\"다른 알림에 의해 억제되었습니다 — 더 높은 순위의 알림이 이것을 가리고 있습니다.\",\"last_poll\":\"마지막 폴링\",\"loading\":\"불러오는 중…\",\"n_d_ago\":\"{{n}}일 전\",\"n_h_ago\":\"{{n}}시간 전\",\"n_ledger_entries_matched\":\"원장 항목 {{count}}건이 일치했습니다 — {{detail}}\",\"n_m_ago\":\"{{n}}분 전\",\"n_on_own_identity_exact_match\":\"{{count}}건은 이 공급자 자체의 식별자 기준이며, 이는 정확한 일치입니다.\",\"n_s_ago\":\"{{n}}초 전\",\"n_signals_other\":\"신호 {{count}}건\",\"n_similar_lessons_attached_a_near_miss_other\":\"유사 교훈 {{count}}건이 컨텍스트로 첨부되었습니다 — 일치가 아니라 근접 사례입니다.\",\"no_attribution_cannot_say_who_parked_it\":\"이 공급자는 출처 정보를 게시하지 않으므로 누가 보류했는지, 언제 돌아오는지 알 수 없습니다.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"빠른 경로 기준을 넘은 패턴이 없으므로 에이전트는 제안하기 전에 확인해야 합니다.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"신호 소스가 설정되지 않아 아무것도 폴링되지 않았습니다. 조용한 보드는 아직\\n 아무 의미가 없습니다 — 설정에서 소스를 연결하세요.\",\"no_signal_sources_registered\":\"등록된 신호 소스가 없습니다.\",\"no_sources_reporting_a_firing_signal\":\"발생 중인 신호를 보고하는 소스가 없습니다.\",\"not_polled_yet_not_the_same_as_healthy\":\"아직 폴링되지 않음 — 이는 정상과 같지 않습니다\",\"nothing_firing_but_parked_signals_not_investigated\":\"발생 중인 것은 없지만 위의 보류된 신호는 조사되지 않고 있습니다\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"발생 중인 것은 없습니다 — 다만 신호 {{count}}건이 공급자에 보류되어 있어(위 참조) 가져가지 않습니다.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"원장에서 일치하는 것이 없어 조사를 처음부터 시작합니다.\",\"nothing_unclaimed\":\"미인수 없음\",\"one_ledger_entry_matched\":\"원장 항목 1건이 일치했습니다 — {{detail}}\",\"parked\":\"보류\",\"parked_2\":\"보류됨\",\"parked_at_the_provider\":\"공급자에 보류됨\",\"poll_answered\":\"응답함\",\"poll_every_configured_source_now_read_only\":\"지금 설정된 모든 소스를 폴링(읽기 전용)\",\"poll_now\":\"지금 폴링\",\"poll_to_see_what_is_firing\":\"무엇이 발생 중인지 보려면 폴링하세요.\",\"polling\":\"폴링 중…\",\"proven_pattern_matched_agent_may_propose_directly\":\"입증된 패턴이 일치했으므로 에이전트가 수정을 바로 제안할 수 있습니다.\",\"provider\":\"공급자\",\"push_source_absence_note_other\":\"이 폴링에 없는 신호는 복구된 것으로 읽을 수 있습니다. 단 {{sources}}은(는) 예외입니다 — 이들은 폴링마다 비워지는 스풀로 푸시 전달하므로, 이미 전달된 신호는 아직 발생 중인지 여부와 무관하게 다시 나타나지 않습니다.\",\"recovered\":\"복구됨\",\"reported_recovered\":\"복구 보고됨\",\"signal_sources\":\"신호 소스\",\"silenced_by_review_or_let_expire\":\"{{by}}에 의해 무음 처리되었습니다 — 검토하거나 공급자에서 무음이 만료되도록 두세요.\",\"someone_silenced_these_where_they_came_from_so_t\":\"누군가 이들을 발생한 곳에서 무음 처리했으므로 조사되지 않고 있으며\\n 인시던트도 열리지 않았습니다. ‘사람이 보류함’과\\n ‘앱이 무시함’이 그렇지 않으면 똑같이 보이기 때문에 목록에 표시됩니다.\",\"source\":\"소스\",\"sources_did_not_answer_this_poll\":\"{{sources}}이(가) 이 폴링에 응답하지 않았습니다.\",\"spool_full_note\":\"스풀이 {{limit}}에서 가득 차 새 전달이 도착하면 가장 오래된 전달이 버려집니다. 보드에서 주기를 실행하세요(‘폴링 및 인수’).\",\"state\":\"상태\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"하트비트는 주기마다 몇 건씩 인수하므로 급증하면 대기열이 남습니다. 기다리지 않고\\n 조사를 시작하려면 지금 하나를 인수하세요.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"공급자가 이들이 정상으로 돌아왔다고 알렸습니다. 단순히 나타나지 않게 된\\n 신호와 달리 이것은 해결의 근거로 삼을 수 있는 증거입니다.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"이 소스는 폴링마다 비워지는 스풀로 푸시하므로, 이미 전달한 신호는 장애가 아직 살아 있어도 다시 나타나지 않습니다.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"작업이 오는 곳입니다. 자격 증명과 범위는 설정에서 구성하고, 소스가 실제로\\n 무엇을 반환하는지 보려면 여기서 폴링하세요.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"그것이 사실이더라도 신호가 없다는 것이 복구를 뜻하지는 않습니다 — 단지\\n 확인할 수 없었다는 뜻일 수 있습니다.\",\"firing_count_other\":\"{{count}}개 발생 중 ·\",\"parked_count_other\":\"{{count}}개 공급자에 보류됨 ·\",\"cleared_count_other\":\"{{count}}개 해제됨 ·\",\"unclaimed_count_other\":\"{{count}}개 아직 미인수\"}}}") },
	pt: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"backing off\",\"source_health_failed\":\"failed\",\"source_health_not_polled_yet\":\"not polled yet\",\"source_health_not_set_up\":\"not set up\",\"the_last_poll_failed\":\"The last poll failed.\",\"verification_confirmed_label\":\"confirmed\",\"verification_confirmed_meaning\":\"We re-read the signal after the {{verb}} against a source that answered, and it is no longer firing.\",\"verification_could_not_check_label\":\"could not check\",\"verification_could_not_check_meaning\":\"The re-check was due and the source did not answer, so this proves nothing either way. A later cycle will retry it by itself.\",\"verification_not_checkable_label\":\"sent, not confirmed\",\"verification_not_checkable_meaning\":\"The {{verb}} was accepted, but this app cannot observe whether it took effect — an acknowledgement leaves an alert firing by design, so the alarm's state says nothing either way.\",\"verification_pending_label\":\"not checked yet\",\"verification_pending_meaning\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat re-reads the signal to find out whether it took effect.\",\"verification_pending_meaning_at\":\"The {{verb}} returned success, which only means the provider accepted the request. The next heartbeat after {{when}} re-reads the signal to find out whether it took effect.\",\"verification_still_firing_label\":\"still firing after this action\",\"verification_still_firing_meaning\":\"The provider accepted the {{verb}} and the signal was still firing when we looked again. The condition this was opened for is live.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"A pattern appears here once the same failure has matched twice — one occurrence is an incident, not a pattern.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Applied, and the signal kept firing afterwards\",\"at_least_one_source_did_not_answer_the_last_poll\":\"At least one source did not answer the last poll.\",\"building_the_digest\":\"Building the digest…\",\"claimed_by_hand\":\"claimed by hand\",\"claimed_by_hand_not_the_heartbeat\":\"Claimed by hand, not the heartbeat\",\"copied\":\"Copied\",\"copy_as_text\":\"Copy as text\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Copy the digest as text, for a handover thread\",\"coverage\":\"Coverage\",\"derived_from_configuration_only_no_source_has_be\":\"Derived from configuration only — no source has been polled this session, so\\n              this is not evidence that any of them answers. Poll from the Signals tab.\",\"escalated_to_someone_else\":\"Escalated to someone else\",\"every_configured_source_answered_the_last_poll\":\"Every configured source answered the last poll.\",\"failed\":\"failed\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Handed to another owner, so no longer this app's work — but you may be the\\n            one who has to chase it.\",\"handover\":\"Handover\",\"no_recurring_patterns_yet\":\"No recurring patterns yet\",\"not_configured_blind_spots\":\"Not configured (blind spots): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Nothing is being watched, so a quiet board means nothing. Connect a source in\\n              Settings.\",\"pattern_proven\":\"proven\",\"refresh\":\"Refresh\",\"refreshing\":\"Refreshing…\",\"source_not_answering\":\"{{name}} (not answering)\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} did not answer the last poll.\",\"stopped_with_no_diagnosis\":\"Stopped with no diagnosis\",\"the_investigation_ended_without_recording_anythi\":\"The investigation ended without recording anything, so there is no thread to\\n            pick up. These need restarting rather than answering.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"These do not progress on their own — an unanswered prompt from the last shift\\n            is the first job of this one.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"This fix was applied and the signal was still firing afterwards. Do not\\n                    hand it over as the answer — say what has already been tried.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Until that is fixed, a quiet board is not evidence of recovery.\",\"waiting_on_you\":\"Waiting on you\",\"watching_nothing\":\"Watching: nothing\",\"watching_sources\":\"Watching: {{sources}}\",\"what_keeps_happening\":\"What keeps happening\"},\"incidentChat\":{\"ask_about_incident\":\"Ask about {{incidentId}}…\",\"live_investigation_header\":\"Live investigation for {{incident}}{{title}}. Reply here to answer the agent or steer it.\"},\"manifest\":{\"description\":\"Um primeiro respondente autônomo de operações. Vigia seus alarmes, acionamentos e monitores; assume o que dispara; investiga com contexto real; e propõe uma correção — guardando tudo o que aprende em um registro local, para que a segunda ocorrência seja mais rápida que a primeira.\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"Assume um alarme em disparo em um único heartbeat e investiga antes de alguém precisar olhar\",\"highlight_2\":\"Registro de conhecimento com níveis de confiança e credibilidade — uma falha repetida se resolve a partir do que você já sabe\",\"highlight_3\":\"Quadro ao vivo no painel e em threads do Slack que aceitam resposta, para que o canal seja o painel\",\"highlight_4\":\"Conecta AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues ou qualquer sistema capaz de fazer POST de JSON assinado — incluindo corpos no formato do Alertmanager, desdobrados em um incidente por alerta\",\"highlight_5\":\"Somente leitura por padrão — as ações de escrita precisam da sua liberação para cada padrão de sinal, e todas elas são auditadas\",\"highlight_6\":\"Segue a escala de plantão: o nível de automação se arma e se desarma sozinho\",\"page_label\":\"Mission Control\",\"use_case_1\":\"Monitore sinais operacionais, investigue incidentes, reutilize correções comprovadas e entregue uma trilha de auditoria local completa.\",\"configuration_1\":\"Adicione provedores em Configurações usando credenciais de ambiente ou tokens, mantenha Observe para uso somente leitura e habilite explicitamente as ações Propose ou Act permitidas; a saída para o Slack reutiliza uma conexão existente do Kiro Crew.\"},\"opsMissionControlPage\":{\"act\":\"Act\",\"active\":\"Active\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — anyone can record those two\\n                                      values, so the fast path also needs\",\"approve_and_run\":\"Approve and run\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"At least one source did not answer the last poll, so absence of a signal does not mean recovery.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Autonomous first responder for your alarms, pages, and monitors\",\"awaiting_your_approval\":\"Awaiting your approval\",\"board\":\"Board\",\"claiming\":\"Claiming…\",\"closed_postmortems\":\"Closed — postmortems\",\"confidence\":\"confidence\",\"confidence_2\":\"Confidence\",\"connect_a_provider_in_settings_to_start_watching\":\"Connect a provider in Settings to start watching.\",\"copied\":\"Copied\",\"copy_postmortem\":\"Copy postmortem\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Copy the postmortem exactly as written, for a ticket or a review\",\"demoted\":\"demoted\",\"demoted_note\":\"Demoted: this fix was applied and the signal was still firing afterwards{{recent}}. It is kept because a fix that works sometimes is worth more than none, but treat it as already tried rather than as the answer.\",\"demoted_refuted_summary_plural\":\"{{demoted}} of {{total}} entries have been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"demoted_refuted_summary_singular\":\"{{demoted}} of {{total}} entry has been refuted — the fix was applied and the signal kept firing. They may not all be in the {{rows}} rows above.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Drafts actions and asks — nothing executes unapproved\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Empty. Each investigation that finds a reusable fix records it here, so a\\n              repeat failure resolves from what you already know.\",\"every_configured_source_answered_the_last_poll_s\":\"Every configured source answered the last poll, so this quiet is real.\",\"executes_actions_granted_by_your_rules_every_one\":\"Executes actions granted by your rules — every one is audited\",\"expand_the_row_below_for_what_was_attempted_the\":\"Expand the row below for what was attempted. The ledger entries cited have\\n                been marked as having failed.\",\"expires_at_time\":\"expires {{time}}\",\"failed\":\"failed\",\"failed_2\":\"Failed\",\"fast_path\":\"Fast path\",\"fix_label\":\"Fix: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"hypothesis — agent must confirm first\",\"is_no_longer_in_the_ledger\":\"is no longer in the\\n                                    ledger.\",\"knowledge_ledger\":\"Knowledge ledger\",\"known_patterns\":\"Known patterns\",\"leader\":\"leader\",\"ledger_entry_locked\":\"locked\",\"ledger_entry_unlocked\":\"unlocked\",\"loading\":\"Loading…\",\"mark_resolved\":\"Mark resolved\",\"marked_verified_and_high_confidence_but_used_onl\":\"Marked verified and high confidence, but used only\",\"match_basis\":\"Match basis\",\"match_basis_exact\":\"{{source}} publishes an exact identity for this failure ({{key}}), which the ledger prefers over our shape hash.\",\"matched_entry\":\"Matched entry\",\"member_is_this_instance\":\"{{login}} (this instance)\",\"mission_control\":\"Mission Control\",\"mode\":\"Mode\",\"n_matched\":\"{{count}} matched\",\"no_diagnosis_recorded_yet\":\"No diagnosis recorded yet.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Set the schedule-file provider's github_login, or authenticate\\n                the gh CLI.\",\"no_incidents_claimed\":\"No incidents claimed\",\"no_postmortem_was_written_for_this_incident_inci\":\"No postmortem was written for this incident. Incidents that closed before\\n        postmortems were written do not have one, and nothing back-fills them — the record\\n        would have to be invented.\",\"no_providers_set_up_open_settings_to_connect_one\":\"No providers are set up yet — open Settings to connect one.\",\"no_source_configured_nothing_polled_connect_one\":\"No source is configured, so nothing was polled. Connect a provider in Settings.\",\"none_matched\":\"none matched\",\"not_on_roster_lenient\":\"This instance ({{me}}) is not named in the schedule. Strict gating is off, so it still picks up work — which means it does not wait for any teammate. Add it to a who: list if the rotation is meant to decide.\",\"not_on_roster_strict\":\"This instance ({{me}}) is not named in the schedule, so under strict gating it will never pick up work. Add it to a who: list in rotation.yaml, or correct its GitHub login in Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Nothing claimed — but the board is not verified\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Nothing has closed yet. When an incident is resolved or escalated, its postmortem\\n          is written here — one Markdown file per incident, which is the form to attach to a\\n          ticket or hand to a colleague.\",\"nothing_is_firing\":\"Nothing is firing\",\"observe\":\"Observe\",\"off_shift\":\"off shift\",\"off_shift_who_is_on_call\":\"off shift — {{who}} is on call{{until}}\",\"on_call_now\":\"On call now\",\"on_call_team\":\"On-call team\",\"on_shift\":\"On shift{{until}}\",\"on_shift_who\":\"On shift: {{who}}{{until}}\",\"open_in_provider\":\"Open in provider\",\"pattern\":\"Pattern\",\"patterns_known\":\"Patterns known\",\"patterns_proven\":\"Patterns proven\",\"poll_and_claim\":\"Poll & claim\",\"poll_every_configured_source_now_and_claim_anyth\":\"Poll every configured source now and claim anything new\",\"polled_summary_many\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_one\":\"Polled {{polled}} firing signal; nothing new to claim.\",\"polled_summary_other\":\"Polled {{polled}} firing signals; nothing new to claim.\",\"polled_summary_with_parked_many\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_one\":\"Polled {{polled}} firing signal, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"polled_summary_with_parked_other\":\"Polled {{polled}} firing signals, plus {{suppressed}} parked at the provider and left alone; nothing new to claim.\",\"propose\":\"Propose\",\"proven_agent_may_propose_directly\":\"proven — agent may propose directly\",\"read_only_nothing_is_written_to_any_provider\":\"Read-only — nothing is written to any provider\",\"reading_the_postmortem\":\"Reading the postmortem…\",\"reject\":\"Reject\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Replies in the Slack thread reach this investigation.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Replies in the Slack thread will NOT reach this investigation —\\n                              answer here in the chat below instead.\",\"resource\":\"Resource\",\"rotation_unknown_not_picking_up_work\":\"rotation unknown — not picking up work\",\"rotation_unknown_tier_armed\":\"rotation unknown — tier armed\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Runs nightly ledger hygiene for the team\",\"schedule_problem\":\"Schedule problem: {{error}}\",\"sent\":\"sent\",\"sent_n_ago\":\"sent {{age}} ago\",\"shift_many\":\"{{count}} shifts\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"{{count}} shifts\",\"showing_closed_incidents_many\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_closed_incidents_one\":\"Showing the {{count}} closed incident in the most recent\",\"showing_closed_incidents_other\":\"Showing the {{count}} closed incidents in the most recent\",\"showing_n_of_total\":\"{{shown}} of {{total}} — older ones are on disk but not in this list\",\"source\":\"Source\",\"source_health_not_verified_poll_from_signals_tab\":\"Source health has not been verified this session — poll from the Signals tab to confirm the quiet is real.\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} did not answer the last poll, so absence of a signal does not mean recovery.\",\"sources_wired\":\"Sources wired\",\"status_dispatched\":\"Dispatched\",\"status_escalated\":\"Escalated\",\"status_investigating\":\"Investigating\",\"status_needs_human\":\"Needs human\",\"status_resolved\":\"Resolved\",\"status_stale\":\"Stale\",\"status_unclaimed\":\"Unclaimed\",\"tab_board\":\"Board\",\"tab_handover\":\"Handover\",\"tab_settings\":\"Settings\",\"tab_signals\":\"Signals\",\"the_decision_was_refused\":\"The decision was refused.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"This fix was applied and the signal kept firing\",\"this_provider_published_no_exact_identity_so_any\":\"This provider published no exact identity, so any ledger match\\n                                is our shape hash — a heuristic that merges alarms differing\\n                                only in a number, such as a 4xx and a 5xx rate on one\\n                                resource. Weigh a remembered fix accordingly.\",\"through_sink\":\"through {{sink}}\",\"through_sink_for_duration\":\"through {{sink}} for {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · only the on-call instance picks up work\",\"trust\":\"Trust\",\"unlocked_means_an_investigation_may_propose_this\":\"\\\"Unlocked\\\" means an investigation may propose this fix directly\\n              instead of re-deriving it — which needs all four of verified trust, high\\n              confidence, at least\",\"until_shift_end\":\"until {{end}}\",\"used\":\"used\",\"used_2\":\"Used\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"uses, and no recorded failure.\\n              A locked entry is still handed to the agent in full; it is told to confirm it\\n              first. A demoted entry was tried and the signal kept firing, which is a\\n              stronger warning than an untested guess.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"uses before an agent proposes\\n                                      it without checking.\",\"verification_failed_many\":\"{{count}} incidents were still firing when we re-read them after actions this app reported as applied ({{ids}}).\",\"verification_failed_one\":\"{{id}} was still firing when we re-read it after the action this app reported as applied.\",\"waiting_awaiting_approval\":\"Approve to continue\",\"waiting_awaiting_diagnosis\":\"Stopped, no diagnosis\",\"waiting_awaiting_input\":\"Waiting on you\",\"waiting_on_you\":\"Waiting on you\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"A pattern is required — there is no wildcard grant. Use * to match a prefix, e.g. prod-* covers every resource whose name starts with prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Act needs BOTH the mode above and a rule that matches the signal. The mode alone grants nothing.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act only takes effect for signals matched by a rule you have written. With no\\n              rules, this behaves like Propose.\",\"act_rules\":\"Act rules\",\"active\":\"active\",\"all_actions\":\"all actions\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"An incident waiting on you gets the longer window — being asleep is not the same as\\n        an agent crashing.\",\"autonomy\":\"Autonomy\",\"branch\":\"Branch\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"Channel ID\",\"channel_when_incident_released\":\"Fires when an idle investigation is released for re-pickup.\",\"channel_when_source_health\":\"Fires on the poll where a source stops answering — not again while it stays down.\",\"channel_when_waiting_on_you\":\"Fires the moment an incident starts waiting on a person.\",\"choose_a_source\":\"Choose a source\",\"cli\":\"CLI.\",\"companions_installed_many\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_one\":\"{{count}} adapter package installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"companions_installed_other\":\"{{count}} adapter packages installed: {{names}}. Their sources appear in the list above once admitted; if they do not, the fleet admission policy rejected them — check the gateway log.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Connect a signal source first — a rule naming an unconfigured provider can never match.\",\"credential_retention_note\":\"Stored outside the app's folder, so the agent cannot read them. Note: uninstalling this app does not delete them. Revoke here first if you want the credential gone.\",\"desktop_notifications\":\"Desktop notifications\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"A detached HEAD is left alone on purpose: finish or abort the merge or rebase in progress first, since moving refs under one can lose that work.\",\"enable_provider\":\"Enable {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Exchange happens on the nightly maintenance pass only — not per incident. It runs\\n          on whichever instance has \\\"nightly ledger maintenance\\\" on (see Instance,\\n          below), so an instance with that off never pulls: it works from the copy it already\\n          has, including the copy of\",\"expected_shape_label\":\"Expected shape\",\"explicitly_every_time_what_does_not_work_is\":\"explicitly every time.\\n          What does not work is\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Você o encontra no final do diálogo de detalhes do canal no Slack. Convide primeiro o bot do {{productName}} para o canal, ou a publicação falhará.\",\"get_a_notification_when_something_changes_that_n\":\"Receba uma notificação quando algo mudar e precisar de você — sem workspace do Slack e sem credencial de nenhum tipo. Ela vai para a central de notificações do {{productName}} e para a sua área de trabalho.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"How this instance recognises itself in {{whoKey}}. Leave it blank to use the login the local {{ghCli}} CLI is authenticated as.\",\"grant\":\"Grant\",\"heartbeat_pacing\":\"Heartbeat pacing\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"How much the heartbeat picks up at once, and how long it waits before handing work\\n        back. Releasing an incident does not resolve it — the signal becomes claimable\\n        again, so an investigation whose agent died gets retried instead of pinning the\\n        alarm forever.\",\"in_force_now\":\"In force now\",\"instance\":\"Instance\",\"interrupts_by_default\":\"· interrupts by default\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"is not named in any shift, and\\n                strict gating is off — so this instance picks up work regardless of the\\n                schedule, and does not defer to whoever is on call. Add it to a\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"is not named in any shift, so\\n                under strict gating this instance will never pick up work. Add it to a\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"is\\n          resolved by hand in the repo — publishing a schedule full of conflict markers\\n          would leave every teammate unable to parse who is on call.\",\"it_last_saw\":\"it last\\n          saw.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Leave this on if you are the only one running Ops Mission Control. On a team\\n          sharing one ledger, exactly one instance should be primary so the maintenance pass\\n          does not run once per person.\",\"ledger_conflict\":\"ledger conflict\",\"ledger_intro\":\"Your team's knowledge ledger, exchanged through an ordinary git repo: {{file}} is pulled and pushed by the nightly maintenance pass.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"list if the rotation is meant to\\n                decide who responds.\",\"list_or_correct_the_login_above\":\"list, or correct the login above.\",\"loading\":\"Loading…\",\"main\":\"main\",\"min\":\"min\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Espelhe os incidentes em um canal como um painel ao vivo: uma mensagem por incidente cujo estado é atualizado no lugar, com o diagnóstico na sua thread. Usa a conexão do Slack que o {{productName}} já tem — este app não guarda nenhum token próprio do Slack.\",\"mirror_incidents_to_slack\":\"Mirror incidents to Slack\",\"mode_act_label\":\"Act\",\"mode_help_act\":\"Executes actions for signal patterns you have explicitly allowlisted with a rule. A rule must name a source and a resource pattern — there is no \\\"everything\\\" rule. Every execution is audited.\",\"mode_help_observe\":\"Reads signals and investigates. Writes nothing to any provider. This is the default and the safe place to start.\",\"mode_help_propose\":\"Everything Observe does, plus drafts the acknowledge / resolve / comment action and asks you first. Nothing executes unapproved.\",\"mode_observe_label\":\"Observe\",\"mode_propose_label\":\"Propose\",\"needs_human_derived\":\"Currently {{value}}, derived from the window above, so it moves when that does. Setting it here pins it.\",\"needs_human_pinned\":\"Pinned at {{value}}, independent of the window above.\",\"needs_setup\":\"needs setup\",\"new_claims_per_heartbeat\":\"New claims per heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"The next sync moves it across by itself, unless a different branch of that name already exists — then it refuses rather than choose which history to keep, and the message above names the merge to run.\",\"no_branch_detached_head\":\"no branch (detached HEAD)\",\"no_credential_note\":\"No credential to enter: sync runs {{gitCmd}} as you, with your own SSH key or credential helper. Prefer an SSH remote ({{sshRemote}}) — never paste a URL with a token in it, because this app's settings file is readable without signing in. Leave the branch blank for {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"No GitHub login resolved for this instance, so it cannot tell whether it is\\n                on call. Enter one above, or authenticate the\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"No rules yet — add one below to grant authority for a specific set of resources.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Not reported by this gateway, so the values in force cannot be shown.\",\"not_set\":\"not set\",\"not_set_up\":\"not set up\",\"notify_me_on_state_changes\":\"Notify me on state changes\",\"off\":\"off\",\"on_call_schedule\":\"On-call schedule\",\"one_notification_per_state_change_never_per_hear\":\"One notification per state change, never per heartbeat: a source that stays down\\n        is reported once, not every two minutes. Repeats for the same incident stack into\\n        one row.\",\"only_the_on_call_instance_picks_up_work\":\"Only the on-call instance picks up work\",\"pagerduty_user_id_help\":\"Matched against who PagerDuty reports on call, so this instance can tell whether the pager is yours. Stored where the agent cannot reach it — leave blank to treat anyone on the schedule as you.\",\"incidentio_user_id_help\":\"É comparado com os utilizadores da tua escala do incident.io, para que esta instância saiba se o turno é teu. Fica guardado onde o agente não consegue chegar — deixa em branco para tratar qualquer pessoa da escala como tu. Com um ID definido mas sem escalas configuradas, esta instância fica fora do turno.\",\"identity_save_refused\":\"O teu ID não foi guardado — o repositório de definições recusou a escrita. Tenta novamente.\",\"change_save_refused\":\"A tua alteração não foi guardada — o repositório de definições recusou a escrita. Tenta novamente.\",\"value_too_long_refused\":\"Esse valor é demasiado longo, por isso não foi guardado.\",\"prod_star\":\"prod-*\",\"providers\":\"Providers\",\"pushes_stay_refused_until\":\"Pushes stay refused until\",\"quiet_and_expires_on_its_own\":\"· quiet, and expires on its own\",\"ready\":\"ready\",\"release_a_question_after\":\"Release a question after\",\"release_an_investigation_after\":\"Release an investigation after\",\"remote\":\"Remote\",\"replace\":\"Replace\",\"repository\":\"Repository\",\"resolved_from_the_gh_cli_when_blank\":\"resolved from the gh CLI when blank\",\"resource_pattern\":\"Resource pattern\",\"revoke_rule\":\"Revoke rule\",\"revoke_stored_credentials\":\"Revoke stored credentials\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"run by hand in the ledger directory,\\n          because this branch has no upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Run nightly ledger maintenance on this instance\",\"save\":\"Save\",\"schedule_conflict\":\"schedule conflict\",\"schedule_location_note\":\"There is no path to pick here: the schedule is a {{schedule}}, committed to the repo above beside {{ledger}}. The location is fixed on purpose, because a rotation every instance reads has to live where every instance looks.\",\"share_the_knowledge_ledger_with_my_team\":\"Share the knowledge ledger with my team\",\"shared_team_memory\":\"Shared team memory\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Sharing is not set up above, so the schedule is whatever exists on this machine\\n            and reaches nobody else.\",\"signal_source\":\"Signal source\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"stored — enter a new value to replace\",\"strict_off_explanation\":\"When the schedule cannot say whether you are on call, this instance works anyway — and so does every other one, so two teammates can act on the same alert. Prefer this only on a solo install.\",\"strict_on_explanation\":\"When the schedule cannot say whether you are on call, this instance stands down. That is what keeps exactly one teammate working an alert.\",\"syncing\":\"syncing\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"The maximum this instance may do. A per-signal rule can narrow this, never widen\\n          it — so leaving it on Observe keeps the app read-only no matter what rules exist.\",\"this_repo_is_on\":\"This repo is on\",\"to_silence_one_of_these_without_turning_the_rest\":\"To silence one of these without turning the rest off — or to change how loudly\\n            it interrupts — use Settings → Notifications, where every app channel is\\n            listed. A channel appears there after it first fires.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Turn on the systems you want watched. AWS uses your existing credentials — no key\\n          is stored. Tokens for other providers are kept where the agent cannot read them.\",\"unavailable_here\":\"unavailable here\",\"when_a_state_changes\":\"when a state changes\",\"who\":\"who\",\"wrong_local_branch\":\"wrong local branch\",\"your_github_login\":\"Your GitHub login\",\"your_pagerduty_user_id\":\"Your PagerDuty user ID\",\"your_incident_io_user_id\":\"Your incident.io user ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Your team's ledger is still being exchanged — sync names\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"A signal that is absent from this poll can be read as recovered.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"all on our shape hash, which merges alarms differing only in a number. Weigh the remembered fix accordingly.\",\"at_least_one_source_did_not_answer_this_poll\":\"At least one source did not answer this poll.\",\"claim\":\"Claim\",\"claimed\":\"Claimed\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· delivered by push, so an empty poll means nothing\",\"every_configured_source_answered\":\"Every configured source answered.\",\"everything_firing_already_has_an_incident\":\"Everything currently firing already has an incident.\",\"firing\":\"Firing\",\"firing_not_yet_claimed\":\"Firing, not yet claimed\",\"inbound_webhook_queued_many\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inbound_webhook_queued_one\":\"{{count}} inbound webhook signal delivered and waiting for the next cycle to pick it up — it is not on the board yet.\",\"inbound_webhook_queued_other\":\"{{count}} inbound webhook signals delivered and waiting for the next cycle to pick them up — they are not on the board yet.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Inhibited by {{by}} — a higher-ranked alert is masking this one; go look at that alert.\",\"inhibited_by_another_alert_masking_this_one\":\"Inhibited by another alert — a higher-ranked alert is masking this one.\",\"last_poll\":\"Last poll\",\"loading\":\"Loading…\",\"n_d_ago\":\"{{n}}d ago\",\"n_h_ago\":\"{{n}}h ago\",\"n_ledger_entries_matched\":\"{{count}} ledger entries matched — {{detail}}\",\"n_m_ago\":\"{{n}}m ago\",\"n_on_own_identity_exact_match\":\"{{count}} on this provider's own identity, which is an exact match.\",\"n_s_ago\":\"{{n}}s ago\",\"n_signals_many\":\"{{count}} signals\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"{{count}} signals\",\"n_similar_lessons_attached_a_near_miss_many\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_one\":\"{{count}} similar lesson attached as context — a near-miss, not a match.\",\"n_similar_lessons_attached_a_near_miss_other\":\"{{count}} similar lessons attached as context — a near-miss, not a match.\",\"no_attribution_cannot_say_who_parked_it\":\"This provider published no attribution, so we cannot say who parked it or when it comes back.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"No pattern cleared the fast-path bar, so the agent must confirm before proposing.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"No signal source is configured, so nothing was polled. A quiet board means\\n                nothing yet — connect a source in Settings.\",\"no_signal_sources_registered\":\"No signal sources registered.\",\"no_sources_reporting_a_firing_signal\":\"No sources are reporting a firing signal.\",\"not_polled_yet_not_the_same_as_healthy\":\"not polled yet — this is not the same as healthy\",\"nothing_firing_but_parked_signals_not_investigated\":\"nothing is firing, but the parked signals above are not being investigated\",\"nothing_firing_but_signals_parked_not_picked_up_many\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Nothing is firing — but {{count}} signal is parked at the provider (see above) and will not be picked up.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Nothing is firing — but {{count}} signals are parked at the provider (see above) and will not be picked up.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"Nothing in the ledger matched, so the investigation starts from scratch.\",\"nothing_unclaimed\":\"Nothing unclaimed\",\"one_ledger_entry_matched\":\"1 ledger entry matched — {{detail}}\",\"parked\":\"Parked\",\"parked_2\":\"parked\",\"parked_at_the_provider\":\"Parked at the provider\",\"poll_answered\":\"answered\",\"poll_every_configured_source_now_read_only\":\"Poll every configured source now (read-only)\",\"poll_now\":\"Poll now\",\"poll_to_see_what_is_firing\":\"Poll to see what is firing.\",\"polling\":\"Polling…\",\"proven_pattern_matched_agent_may_propose_directly\":\"A proven pattern matched, so the agent may propose its fix directly.\",\"provider\":\"Provider\",\"push_source_absence_note_many\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_one\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — it delivers by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"push_source_absence_note_other\":\"A signal absent from this poll can be read as recovered, EXCEPT for {{sources}} — they deliver by push into a spool that each poll empties, so an already-delivered signal will not appear again whether or not it is still firing.\",\"recovered\":\"recovered\",\"reported_recovered\":\"Reported recovered\",\"signal_sources\":\"Signal sources\",\"silenced_by_review_or_let_expire\":\"Silenced by {{by}} — review or let the silence expire at the provider.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Someone silenced these where they came from, so they are not being investigated\\n            and no incident was opened. They are listed because \\\"parked by a person\\\" and\\n            \\\"the app ignored it\\\" would otherwise look identical.\",\"source\":\"Source\",\"sources_did_not_answer_this_poll\":\"{{sources}} did not answer this poll.\",\"spool_full_note\":\"The spool is full at {{limit}}, so the oldest deliveries are being discarded as new ones arrive. Run a cycle from the Board (\\\"Poll & claim\\\").\",\"state\":\"State\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"The heartbeat claims a few per cycle, so a burst leaves a queue. Claim one\\n          now to start its investigation without waiting.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"The provider said these are back to normal. Unlike a signal that merely stopped\\n            appearing, this is evidence you can resolve on.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"This source pushes to a spool that each poll empties, so a signal it already delivered will not appear again even if the fault is still live.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Where work comes from. Configure credentials and scope in Settings; poll\\n          here to see what a source actually returns.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"While that is true, absence of a signal does NOT mean recovery — it may just\\n                mean we could not look.\",\"firing_count_one\":\"{{count}} disparando ·\",\"firing_count_many\":\"{{count}} disparando ·\",\"firing_count_other\":\"{{count}} disparando ·\",\"parked_count_one\":\"{{count}} em espera no provedor ·\",\"parked_count_many\":\"{{count}} em espera no provedor ·\",\"parked_count_other\":\"{{count}} em espera no provedor ·\",\"cleared_count_one\":\"{{count}} resolvido ·\",\"cleared_count_many\":\"{{count}} resolvidos ·\",\"cleared_count_other\":\"{{count}} resolvidos ·\",\"unclaimed_count_one\":\"{{count}} ainda não assumido\",\"unclaimed_count_many\":\"{{count}} ainda não assumidos\",\"unclaimed_count_other\":\"{{count}} ainda não assumidos\"}}}") },
	ru: { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"пауза перед повтором\",\"source_health_failed\":\"сбой\",\"source_health_not_polled_yet\":\"ещё не опрашивался\",\"source_health_not_set_up\":\"не настроен\",\"the_last_poll_failed\":\"Последний опрос завершился ошибкой.\",\"verification_confirmed_label\":\"подтверждено\",\"verification_confirmed_meaning\":\"После операции {{verb}} мы перечитали сигнал у источника, который ответил, — он больше не срабатывает.\",\"verification_could_not_check_label\":\"не удалось проверить\",\"verification_could_not_check_meaning\":\"Перепроверка была пора, но источник не ответил, так что это ничего не доказывает ни в ту, ни в другую сторону. Следующий цикл повторит попытку сам.\",\"verification_not_checkable_label\":\"отправлено, не подтверждено\",\"verification_not_checkable_meaning\":\"Операция {{verb}} принята, но приложение не может увидеть, подействовала ли она: подтверждение по замыслу оставляет тревогу сработавшей, поэтому состояние тревоги ничего не говорит ни в ту, ни в другую сторону.\",\"verification_pending_label\":\"ещё не проверено\",\"verification_pending_meaning\":\"Операция {{verb}} вернула успех, а это значит лишь, что провайдер принял запрос. Следующий heartbeat перечитает сигнал и выяснит, подействовала ли она.\",\"verification_pending_meaning_at\":\"Операция {{verb}} вернула успех, а это значит лишь, что провайдер принял запрос. Следующий heartbeat после {{when}} перечитает сигнал и выяснит, подействовала ли она.\",\"verification_still_firing_label\":\"после этого действия всё ещё срабатывает\",\"verification_still_firing_meaning\":\"Провайдер принял операцию {{verb}}, и при повторной проверке сигнал всё ещё срабатывал. Условие, из-за которого его открыли, действует.\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"Шаблон появляется здесь, когда один и тот же сбой совпал дважды, — один случай это инцидент, а не шаблон.\",\"applied_and_the_signal_kept_firing_afterwards\":\"Применено, и сигнал продолжал срабатывать\",\"at_least_one_source_did_not_answer_the_last_poll\":\"Хотя бы один источник не ответил на последний опрос.\",\"building_the_digest\":\"Собираю сводку...\",\"claimed_by_hand\":\"взято вручную\",\"claimed_by_hand_not_the_heartbeat\":\"Взято вручную, а не heartbeat\",\"copied\":\"Скопировано\",\"copy_as_text\":\"Скопировать как текст\",\"copy_the_digest_as_text_for_a_handover_thread\":\"Скопировать сводку текстом — для ветки передачи смены\",\"coverage\":\"Покрытие\",\"derived_from_configuration_only_no_source_has_be\":\"Выведено только из настроек — в этой сессии ни один источник не опрашивался, поэтому\\n              это не доказывает, что кто-то из них отвечает. Опроси их на вкладке Signals.\",\"escalated_to_someone_else\":\"Эскалировано другому исполнителю\",\"every_configured_source_answered_the_last_poll\":\"Каждый настроенный источник ответил на последний опрос.\",\"failed\":\"сбой\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"Передано другому владельцу, так что это уже не работа приложения, — но добиваться\\n            результата, возможно, придётся тебе.\",\"handover\":\"Передача смены\",\"no_recurring_patterns_yet\":\"Повторяющихся шаблонов пока нет\",\"not_configured_blind_spots\":\"Не настроено (слепые зоны): {{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"Ничего не отслеживается, поэтому тихая доска ничего не значит. Подключи источник в\\n              разделе Settings.\",\"pattern_proven\":\"подтверждён\",\"refresh\":\"Обновить\",\"refreshing\":\"Обновление...\",\"source_not_answering\":\"{{name}} (не отвечает)\",\"sources_did_not_answer_the_last_poll\":\"Источники {{sources}} не ответили на последний опрос.\",\"stopped_with_no_diagnosis\":\"Остановлено без диагноза\",\"the_investigation_ended_without_recording_anythi\":\"Расследование закончилось, ничего не записав, поэтому продолжать нечего.\\n            Такие нужно запускать заново, а не отвечать на них.\",\"these_do_not_progress_on_their_own_an_unanswered\":\"Сами по себе они не двигаются — оставшийся без ответа вопрос с прошлой смены\\n            это первая задача текущей.\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"Это исправление применяли, и после него сигнал всё ещё срабатывал. Не передавай\\n                    его как ответ — скажи, что уже пробовали.\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"Пока это не исправлено, тихая доска не доказывает, что всё восстановилось.\",\"waiting_on_you\":\"Ждёт тебя\",\"watching_nothing\":\"Отслеживается: ничего\",\"watching_sources\":\"Отслеживаем: {{sources}}\",\"what_keeps_happening\":\"Что повторяется\"},\"incidentChat\":{\"ask_about_incident\":\"Спросить про {{incidentId}}...\",\"live_investigation_header\":\"Идёт расследование {{incident}}{{title}}. Отвечай здесь, чтобы ответить агенту или направить его.\"},\"manifest\":{\"description\":\"Автономный дежурный первой линии по эксплуатации. Следит за твоими тревогами, вызовами пейджера и мониторами; берёт в работу то, что сработало; разбирается с этим, имея на руках реальный контекст; и предлагает исправление — а всё, что узнаёт по ходу, складывает в локальный журнал, чтобы повторный случай разбирался быстрее первого.\",\"display_name\":\"Ops Mission Control\",\"use_case_1\":\"Следите за рабочими сигналами, расследуйте инциденты, повторно используйте проверенные исправления и передавайте полный локальный журнал аудита следующей смене.\",\"configuration_1\":\"Добавьте провайдеров в Settings с учётными данными окружения или токенами, оставьте Observe для работы только на чтение и явно разрешите нужные действия Propose или Act; вывод в Slack использует существующее подключение Kiro Crew.\",\"highlight_1\":\"Берёт сработавшую тревогу в работу за один цикл heartbeat и начинает разбираться раньше, чем кому-то придётся смотреть\",\"highlight_2\":\"Журнал знаний с уровнями уверенности и доверия — повторный сбой решается по тому, что тебе уже известно\",\"highlight_3\":\"Живая доска на панели и ветки Slack, в которых можно отвечать, так что канал и есть панель\",\"highlight_4\":\"Подключает AWS CloudWatch, PagerDuty, Datadog, incident.io, GitHub Issues или любую систему, которая умеет отправить подписанный JSON методом POST — включая тела в формате Alertmanager, которые разворачиваются в отдельный инцидент на каждое оповещение\",\"highlight_5\":\"По умолчанию только чтение — запись включается отдельно для каждого шаблона сигнала, и каждая такая операция протоколируется\",\"highlight_6\":\"С учётом графика дежурств: уровень автоматизации сам включается на смене и выключается после неё\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"Действие\",\"active\":\"Активно\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — эти два значения может записать кто угодно, поэтому быстрому пути нужно\\n                                      не менее\",\"approve_and_run\":\"Одобрить и запустить\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"Хотя бы один источник не ответил на последний опрос, поэтому отсутствие сигнала не значит, что всё восстановилось.\",\"autonomous_first_responder_for_your_alarms_pages\":\"Автономный дежурный первой линии по твоим тревогам, вызовам пейджера и мониторам\",\"awaiting_your_approval\":\"Ждёт твоего одобрения\",\"board\":\"Доска\",\"claiming\":\"Берём в работу...\",\"closed_postmortems\":\"Закрытые — постмортемы\",\"confidence\":\"уверенность\",\"confidence_2\":\"Уверенность\",\"connect_a_provider_in_settings_to_start_watching\":\"Подключи провайдера в разделе Settings, чтобы начать наблюдение.\",\"copied\":\"Скопировано\",\"copy_postmortem\":\"Скопировать постмортем\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"Скопировать постмортем ровно как написано — для тикета или ревью\",\"demoted\":\"понижено\",\"demoted_note\":\"Понижено: это исправление применяли, и после него сигнал всё ещё срабатывал{{recent}}. Запись оставлена, потому что исправление, которое иногда работает, лучше, чем никакого, — но считай его уже испробованным, а не ответом.\",\"demoted_refuted_summary_plural\":\"Опровергнуто записей: {{demoted}} из {{total}} — исправление применяли, а сигнал продолжал срабатывать. Не все они обязательно попали в {{rows}} строк выше.\",\"demoted_refuted_summary_singular\":\"Опровергнуто записей: {{demoted}} из {{total}} — исправление применяли, а сигнал продолжал срабатывать. Она может и не попасть в {{rows}} строк выше.\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"Готовит действия и спрашивает — без одобрения ничего не выполняется\",\"empty_each_investigation_that_finds_a_reusable_f\":\"Пусто. Каждое расследование, которое нашло переиспользуемое исправление, записывает его здесь,\\n              чтобы повторный сбой решался по тому, что тебе уже известно.\",\"every_configured_source_answered_the_last_poll_s\":\"Каждый настроенный источник ответил на последний опрос, так что эта тишина настоящая.\",\"executes_actions_granted_by_your_rules_every_one\":\"Выполняет действия, разрешённые твоими правилами, — каждое протоколируется\",\"expand_the_row_below_for_what_was_attempted_the\":\"Разверни строку ниже, чтобы увидеть, что пробовали. Приведённые записи журнала\\n                отмечены как неудачные.\",\"expires_at_time\":\"истекает {{time}}\",\"failed\":\"сбой\",\"failed_2\":\"Сбой\",\"fast_path\":\"Быстрый путь\",\"fix_label\":\"Исправление: {{fix}}\",\"hypothesis_agent_must_confirm_first\":\"гипотеза — агент должен сначала подтвердить\",\"is_no_longer_in_the_ledger\":\"— её больше нет в\\n                                    журнале.\",\"knowledge_ledger\":\"Журнал знаний\",\"known_patterns\":\"Известные шаблоны\",\"leader\":\"лидер\",\"ledger_entry_locked\":\"заблокировано\",\"ledger_entry_unlocked\":\"разблокировано\",\"loading\":\"Загрузка...\",\"mark_resolved\":\"Отметить как решённое\",\"marked_verified_and_high_confidence_but_used_onl\":\"Отмечено как подтверждённое и с высокой уверенностью, но использовано лишь\",\"match_basis\":\"Основание совпадения\",\"match_basis_exact\":\"{{source}} публикует точный идентификатор этого сбоя ({{key}}), и журнал предпочитает его нашему хешу формы.\",\"matched_entry\":\"Совпавшая запись\",\"member_is_this_instance\":\"{{login}} (этот экземпляр)\",\"mission_control\":\"Mission Control\",\"mode\":\"Режим\",\"n_matched\":\"Совпадений: {{count}}\",\"no_diagnosis_recorded_yet\":\"Диагноз пока не записан.\",\"no_github_login_resolved_for_this_instance_so_it\":\"Для этого экземпляра не определён логин GitHub, поэтому он не может понять, на дежурстве\\n                ли он. Задай github_login у провайдера файла графика или авторизуй\\n                gh CLI.\",\"no_incidents_claimed\":\"Ни один инцидент не взят в работу\",\"no_postmortem_was_written_for_this_incident_inci\":\"Для этого инцидента постмортем не писали. У инцидентов, закрытых до того, как\\n        появились постмортемы, его нет, и никто не добавляет их задним числом — запись\\n        пришлось бы выдумать.\",\"no_providers_set_up_open_settings_to_connect_one\":\"Провайдеры пока не настроены — открой Settings, чтобы подключить один.\",\"no_source_configured_nothing_polled_connect_one\":\"Ни один источник не настроен, поэтому опрашивать было нечего. Подключи провайдера в разделе Settings.\",\"none_matched\":\"совпадений нет\",\"not_on_roster_lenient\":\"Этот экземпляр ({{me}}) не указан в графике. Строгий режим выключен, поэтому он всё равно берёт работу — а значит, не ждёт никого из команды. Добавь его в список who:, если решать должна ротация.\",\"not_on_roster_strict\":\"Этот экземпляр ({{me}}) не указан в графике, поэтому при строгом режиме он никогда не возьмёт работу. Добавь его в список who: в rotation.yaml или исправь его логин GitHub в разделе Settings.\",\"nothing_claimed_but_the_board_is_not_verified\":\"Ничего не взято — но доска не проверена\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"Пока ничего не закрыто. Когда инцидент решён или эскалирован, здесь пишется его постмортем —\\n          по одному файлу Markdown на инцидент; именно в таком виде его удобно приложить к\\n          тикету или передать коллеге.\",\"nothing_is_firing\":\"Ничего не срабатывает\",\"observe\":\"Наблюдение\",\"off_shift\":\"не на смене\",\"off_shift_who_is_on_call\":\"не на смене — дежурит {{who}}{{until}}\",\"on_call_now\":\"Сейчас на дежурстве\",\"on_call_team\":\"Команда дежурных\",\"on_shift\":\"На смене{{until}}\",\"on_shift_who\":\"На смене: {{who}}{{until}}\",\"open_in_provider\":\"Открыть у провайдера\",\"pattern\":\"Шаблон\",\"patterns_known\":\"Известных шаблонов\",\"patterns_proven\":\"Подтверждённых шаблонов\",\"poll_and_claim\":\"Опросить и взять\",\"poll_every_configured_source_now_and_claim_anyth\":\"Опросить сейчас каждый настроенный источник и взять в работу всё новое\",\"polled_summary_few\":\"Опрошено {{polled}} сработавших сигнала; брать в работу нечего.\",\"polled_summary_many\":\"Опрошено {{polled}} сработавших сигналов; брать в работу нечего.\",\"polled_summary_one\":\"Опрошен {{polled}} сработавший сигнал; брать в работу нечего.\",\"polled_summary_other\":\"Опрошено {{polled}} сработавших сигнала; брать в работу нечего.\",\"polled_summary_with_parked_few\":\"Опрошено {{polled}} сработавших сигнала, ещё {{suppressed}} отложено у провайдера и не тронуто; брать в работу нечего.\",\"polled_summary_with_parked_many\":\"Опрошено {{polled}} сработавших сигналов, ещё {{suppressed}} отложено у провайдера и не тронуто; брать в работу нечего.\",\"polled_summary_with_parked_one\":\"Опрошен {{polled}} сработавший сигнал, ещё {{suppressed}} отложено у провайдера и не тронуто; брать в работу нечего.\",\"polled_summary_with_parked_other\":\"Опрошено {{polled}} сработавших сигнала, ещё {{suppressed}} отложено у провайдера и не тронуто; брать в работу нечего.\",\"propose\":\"Предложение\",\"proven_agent_may_propose_directly\":\"подтверждено — агент может предлагать напрямую\",\"read_only_nothing_is_written_to_any_provider\":\"Только чтение — ни одному провайдеру ничего не пишется\",\"reading_the_postmortem\":\"Читаю постмортем...\",\"reject\":\"Отклонить\",\"replies_in_the_slack_thread_reach_this_investiga\":\"Ответы в ветке Slack доходят до этого расследования.\",\"replies_in_the_slack_thread_will_not_reach_this\":\"Ответы в ветке Slack НЕ дойдут до этого расследования —\\n                              отвечай здесь, в чате ниже.\",\"resource\":\"Ресурс\",\"rotation_unknown_not_picking_up_work\":\"ротация неизвестна — работу не берёт\",\"rotation_unknown_tier_armed\":\"ротация неизвестна — уровень включён\",\"runs_nightly_ledger_hygiene_for_the_team\":\"Выполняет ночную гигиену журнала за команду\",\"schedule_problem\":\"Проблема с графиком: {{error}}\",\"sent\":\"отправлено\",\"sent_n_ago\":\"отправлено {{age}} назад\",\"shift_few\":\"{{count}} shifts\",\"shift_many\":\"{{count}} shifts\",\"shift_one\":\"{{count}} shift\",\"shift_other\":\"Смен: {{count}}\",\"showing_closed_incidents_few\":\"Показано {{count}} закрытых инцидента за последние\",\"showing_closed_incidents_many\":\"Показано {{count}} закрытых инцидентов за последние\",\"showing_closed_incidents_one\":\"Показан {{count}} закрытый инцидент за последние\",\"showing_closed_incidents_other\":\"Показано {{count}} закрытых инцидента за последние\",\"showing_n_of_total\":\"{{shown}} из {{total}} — более старые есть на диске, но не в этом списке\",\"source\":\"Источник\",\"source_health_not_verified_poll_from_signals_tab\":\"Здоровье источников в этой сессии не проверялось — опроси их на вкладке Signals, чтобы убедиться, что тишина настоящая.\",\"sources_did_not_answer_absence_not_recovery\":\"Источники {{sources}} не ответили на последний опрос, поэтому отсутствие сигнала не значит, что всё восстановилось.\",\"sources_wired\":\"Подключено источников\",\"status_dispatched\":\"Назначен\",\"status_escalated\":\"Эскалирован\",\"status_investigating\":\"Расследуется\",\"status_needs_human\":\"Нужен человек\",\"status_resolved\":\"Решён\",\"status_stale\":\"Устарел\",\"status_unclaimed\":\"Не взят\",\"tab_board\":\"Доска\",\"tab_handover\":\"Передача смены\",\"tab_settings\":\"Настройки\",\"tab_signals\":\"Сигналы\",\"the_decision_was_refused\":\"Решение отклонено.\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"Это исправление применяли, и сигнал продолжал срабатывать\",\"this_provider_published_no_exact_identity_so_any\":\"Этот провайдер не публикует точный идентификатор, поэтому любое совпадение с журналом\\n                                идёт по нашему хешу формы — эвристике, которая склеивает тревоги, различающиеся\\n                                лишь числом, например частоту 4xx и 5xx на одном\\n                                ресурсе. Оценивай запомненное исправление с этой поправкой.\",\"through_sink\":\"через {{sink}}\",\"through_sink_for_duration\":\"через {{sink}} на {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · работу берёт только дежурный экземпляр\",\"trust\":\"Доверие\",\"unlocked_means_an_investigation_may_propose_this\":\"«Unlocked» означает, что расследование может предложить это исправление напрямую,\\n              а не выводить его заново, — для этого нужны все четыре условия: подтверждённое доверие, высокая\\n              уверенность, не менее\",\"until_shift_end\":\"до {{end}}\",\"used\":\"использовано\",\"used_2\":\"Использовано\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"использований и ни одного зафиксированного провала.\\n              Заблокированная запись всё равно передаётся агенту целиком; ему велено сначала её\\n              подтвердить. Понижённую запись пробовали, и сигнал продолжал срабатывать, а это\\n              предупреждение сильнее непроверенной догадки.\",\"uses_before_an_agent_proposes_it_without_checkin\":\"использований, прежде чем агент предложит\\n                                      его без проверки.\",\"verification_failed_many\":\"{{count}} инцидентов всё ещё срабатывали, когда мы перечитали их после действий, о применении которых сообщило это приложение ({{ids}}).\",\"verification_failed_one\":\"{{id}} всё ещё срабатывал, когда мы перечитали его после действия, о применении которого сообщило это приложение.\",\"waiting_awaiting_approval\":\"Одобри, чтобы продолжить\",\"waiting_awaiting_diagnosis\":\"Остановлено, диагноза нет\",\"waiting_awaiting_input\":\"Ждёт тебя\",\"waiting_on_you\":\"Ждёт тебя\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"Шаблон обязателен — разрешения «на всё» не существует. Используй *, чтобы задать префикс: например, prod-* охватывает все ресурсы, чьё имя начинается на prod-.\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"Для Act нужно И выставленный выше режим, И правило, совпадающее с сигналом. Сам по себе режим ничего не даёт.\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"Act действует только для сигналов, попавших под написанное тобой правило. Без\\n              правил он работает как Propose.\",\"act_rules\":\"Правила для Act\",\"active\":\"активно\",\"all_actions\":\"все действия\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"Инцидент, который ждёт тебя, получает более длинное окно — то, что ты спишь, не то же самое,\\n        что упавший агент.\",\"autonomy\":\"Автономность\",\"branch\":\"Ветка\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"ID канала\",\"channel_when_incident_released\":\"Срабатывает, когда простаивающее расследование освобождается, чтобы его взяли заново.\",\"channel_when_source_health\":\"Срабатывает на том опросе, где источник перестал отвечать, — и не повторяется, пока он лежит.\",\"channel_when_waiting_on_you\":\"Срабатывает в тот момент, когда инцидент начинает ждать человека.\",\"choose_a_source\":\"Выбери источник\",\"cli\":\"CLI.\",\"companions_installed_few\":\"Установлено {{count}} пакета-адаптера: {{names}}. Их источники появятся в списке выше после допуска; если не появились, их отклонила политика допуска — смотри лог шлюза.\",\"companions_installed_many\":\"Установлено {{count}} пакетов-адаптеров: {{names}}. Их источники появятся в списке выше после допуска; если не появились, их отклонила политика допуска — смотри лог шлюза.\",\"companions_installed_one\":\"Установлен {{count}} пакет-адаптер: {{names}}. Его источники появятся в списке выше после допуска; если не появились, его отклонила политика допуска — смотри лог шлюза.\",\"companions_installed_other\":\"Установлено {{count}} пакета-адаптера: {{names}}. Их источники появятся в списке выше после допуска; если не появились, их отклонила политика допуска — смотри лог шлюза.\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"Сначала подключи источник сигналов — правило, называющее ненастроенного провайдера, никогда не совпадёт.\",\"credential_retention_note\":\"Хранятся вне папки приложения, поэтому агент их не прочитает. Учти: удаление приложения их не стирает. Если учётные данные должны исчезнуть, сначала отзови их здесь.\",\"desktop_notifications\":\"Уведомления на рабочем столе\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEAD намеренно оставляют в покое: сначала заверши или отмени начатый merge или rebase — если двигать ссылки под ним, эта работа может потеряться.\",\"enable_provider\":\"Включить {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"Обмен идёт только на ночном проходе обслуживания — не по каждому инциденту. Он выполняется\\n          на том экземпляре, где включено «ночное обслуживание журнала» (см. Instance\\n          ниже), поэтому экземпляр с выключенной настройкой ничего не забирает: он работает по той копии, что\\n          у него уже есть, включая копию файла\",\"expected_shape_label\":\"Ожидаемая форма\",\"explicitly_every_time_what_does_not_work_is\":\"и ничего другого.\\n          А не работает вот что: запуск вручную\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"Найди его внизу диалога сведений о канале в Slack. Сначала пригласи в канал\\n            бота {{productName}}, иначе публикация не удастся.\",\"get_a_notification_when_something_changes_that_n\":\"Получай уведомление, когда меняется что-то, требующее твоего участия, — без рабочего пространства Slack\\n        и вообще без каких-либо учётных данных. Оно попадает в центр уведомлений {{productName}} и на\\n        твой рабочий стол.\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"По этому значению экземпляр узнаёт себя в {{whoKey}}. Оставь пустым, чтобы использовать логин, под которым авторизован локальный {{ghCli}} CLI.\",\"grant\":\"Разрешить\",\"heartbeat_pacing\":\"Темп heartbeat\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"Сколько heartbeat берёт за раз и как долго ждёт, прежде чем вернуть работу\\n        обратно. Освобождение инцидента не решает его — сигнал снова можно взять,\\n        поэтому расследование с умершим агентом повторяется, а не держит\\n        тревогу вечно.\",\"in_force_now\":\"Действует сейчас\",\"instance\":\"Экземпляр\",\"interrupts_by_default\":\"· по умолчанию прерывает\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"не указан ни в одной смене, а\\n                строгий режим выключен — поэтому этот экземпляр берёт работу независимо от\\n                графика и не уступает тому, кто дежурит. Добавь его в список\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"не указан ни в одной смене, поэтому\\n                при строгом режиме этот экземпляр никогда не возьмёт работу. Добавь его в список\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"не разберут вручную в репозитории — если опубликовать график, полный маркеров\\n          конфликта, никто в команде не сможет\\n          понять, кто дежурит.\",\"it_last_saw\":\"в том виде, в каком он\\n          видел его последний раз.\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"Оставь включённым, если Ops Mission Control запускаешь только ты. Если команда\\n          делит один журнал, главным должен быть ровно один экземпляр, чтобы проход обслуживания\\n          не выполнялся по разу на человека.\",\"ledger_conflict\":\"конфликт в журнале\",\"ledger_intro\":\"Журнал знаний твоей команды, обмен идёт через обычный репозиторий git: {{file}} забирается и отправляется ночным проходом обслуживания.\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"— если решать, кто отвечает,\\n                должна ротация.\",\"list_or_correct_the_login_above\":\"или исправь логин выше.\",\"loading\":\"Загрузка...\",\"main\":\"main\",\"min\":\"мин\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"Отражай инциденты в канале как живую доску: по одному сообщению на инцидент, состояние\\n        обновляется на месте, а диагноз идёт в его ветку. Используется то подключение к Slack,\\n        которое уже есть у {{productName}}, — своего токена Slack это приложение не хранит.\",\"mirror_incidents_to_slack\":\"Отражать инциденты в Slack\",\"mode_act_label\":\"Действие\",\"mode_help_act\":\"Выполняет действия для шаблонов сигналов, которые ты явно разрешил правилом. Правило обязано называть источник и шаблон ресурса — правила «на всё» не существует. Каждое выполнение протоколируется.\",\"mode_help_observe\":\"Читает сигналы и разбирается в них. Ни одному провайдеру ничего не пишет. Это значение по умолчанию и безопасная точка старта.\",\"mode_help_propose\":\"Всё то же, что Observe, плюс готовит действие подтверждения / решения / комментария и сначала спрашивает тебя. Без одобрения ничего не выполняется.\",\"mode_observe_label\":\"Наблюдение\",\"mode_propose_label\":\"Предложение\",\"needs_human_derived\":\"Сейчас {{value}} — выведено из окна выше, поэтому меняется вместе с ним. Если задать здесь, значение закрепится.\",\"needs_human_pinned\":\"Закреплено на {{value}}, независимо от окна выше.\",\"needs_setup\":\"нужна настройка\",\"new_claims_per_heartbeat\":\"Новых взятий за один heartbeat\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"Следующая синхронизация перенесёт это сама, если только уже не существует другая ветка с таким именем — тогда она откажется, чтобы не выбирать, какую историю оставить, а сообщение выше назовёт нужный merge.\",\"no_branch_detached_head\":\"нет ветки (detached HEAD)\",\"no_credential_note\":\"Вводить учётные данные не нужно: синхронизация выполняет {{gitCmd}} от твоего имени, с твоим SSH-ключом или помощником для учётных данных. Лучше использовать SSH-адрес ({{sshRemote}}) — никогда не вставляй URL с токеном внутри, потому что файл настроек этого приложения читается без входа. Оставь ветку пустой, чтобы взять {{defaultBranch}}.\",\"no_github_login_resolved_for_this_instance_so_it\":\"Для этого экземпляра не определён логин GitHub, поэтому он не может понять, на дежурстве\\n                ли он. Введи его выше или авторизуй\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"Правил пока нет — добавь ниже, чтобы выдать полномочия на конкретный набор ресурсов.\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"Этот шлюз их не сообщает, поэтому действующие значения показать нельзя.\",\"not_set\":\"не задано\",\"not_set_up\":\"не настроено\",\"notify_me_on_state_changes\":\"Уведомлять меня об изменениях состояния\",\"off\":\"выкл\",\"on_call_schedule\":\"График дежурств\",\"one_notification_per_state_change_never_per_hear\":\"Одно уведомление на изменение состояния и никогда — на каждый heartbeat: о лежащем\\n        источнике сообщается один раз, а не каждые две минуты. Повторы по одному инциденту\\n        складываются в одну строку.\",\"only_the_on_call_instance_picks_up_work\":\"Работу берёт только дежурный экземпляр\",\"pagerduty_user_id_help\":\"Сопоставляется с тем, кого PagerDuty считает дежурным, чтобы экземпляр понимал, твой ли это пейджер. Хранится там, куда агенту не добраться, — оставь пустым, чтобы считать своим любого из графика.\",\"incidentio_user_id_help\":\"Сопоставляется с пользователями в твоём графике incident.io, чтобы экземпляр понимал, твоя ли это смена. Хранится там, куда агенту не добраться, — оставь пустым, чтобы считать своим любого из графика. Если ИД задан, а графики не настроены, экземпляр остаётся вне смены.\",\"identity_save_refused\":\"Твой ИД не был сохранён — хранилище настроек отклонило запись. Повтори попытку.\",\"change_save_refused\":\"Твоё изменение не было сохранено — хранилище настроек отклонило запись. Повтори попытку.\",\"value_too_long_refused\":\"Это значение слишком длинное, поэтому оно не было сохранено.\",\"prod_star\":\"prod-*\",\"providers\":\"Провайдеры\",\"pushes_stay_refused_until\":\"Отправки остаются отклонёнными, пока файл\",\"quiet_and_expires_on_its_own\":\"· тихо и истекает само\",\"ready\":\"готов\",\"release_a_question_after\":\"Освобождать вопрос через\",\"release_an_investigation_after\":\"Освобождать расследование через\",\"remote\":\"Удалённый репозиторий\",\"replace\":\"Заменить\",\"repository\":\"Репозиторий\",\"resolved_from_the_gh_cli_when_blank\":\"если пусто, берётся из gh CLI\",\"resource_pattern\":\"Шаблон ресурса\",\"revoke_rule\":\"Отозвать правило\",\"revoke_stored_credentials\":\"Отозвать сохранённые учётные данные\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"в каталоге журнала,\\n          потому что у этой ветки нет upstream.\",\"run_nightly_ledger_maintenance_on_this_instance\":\"Выполнять ночное обслуживание журнала на этом экземпляре\",\"save\":\"Сохранить\",\"schedule_conflict\":\"конфликт в графике\",\"schedule_location_note\":\"Путь здесь не выбирают: график — это {{schedule}}, закоммиченный в репозиторий выше рядом с {{ledger}}. Место зафиксировано намеренно: ротация, которую читает каждый экземпляр, должна лежать там, куда каждый экземпляр смотрит.\",\"share_the_knowledge_ledger_with_my_team\":\"Делиться журналом знаний с моей командой\",\"shared_team_memory\":\"Общая память команды\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"Обмен выше не настроен, поэтому график — это то, что есть на этой машине,\\n            и до других он не доходит.\",\"signal_source\":\"Источник сигналов\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"сохранено — введи новое значение, чтобы заменить\",\"strict_off_explanation\":\"Когда график не может сказать, дежуришь ли ты, этот экземпляр всё равно работает — и все остальные тоже, поэтому по одной тревоге могут действовать двое из команды. Выбирай это только для одиночной установки.\",\"strict_on_explanation\":\"Когда график не может сказать, дежуришь ли ты, этот экземпляр отступает. Именно это и оставляет тревогу ровно одному человеку в команде.\",\"syncing\":\"синхронизация\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"Максимум, что может делать этот экземпляр. Правило для отдельного сигнала может это сузить, но никогда не\\n          расширит — поэтому значение Observe оставляет приложение только читающим, какие бы правила ни существовали.\",\"this_repo_is_on\":\"Этот репозиторий на ветке\",\"to_silence_one_of_these_without_turning_the_rest\":\"Чтобы заглушить одно из них, не выключая остальные, — или изменить, насколько громко\\n            оно прерывает, — открой Настройки → Уведомления, где перечислены все каналы\\n            приложений. Канал появляется там после первого срабатывания.\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"Включи системы, которые хочешь отслеживать. AWS использует твои существующие учётные данные — ключ\\n          не хранится. Токены других провайдеров лежат там, где агент их не прочитает.\",\"unavailable_here\":\"здесь недоступно\",\"when_a_state_changes\":\"когда меняется состояние\",\"who\":\"who\",\"wrong_local_branch\":\"не та локальная ветка\",\"your_github_login\":\"Твой логин GitHub\",\"your_pagerduty_user_id\":\"Твой ID пользователя PagerDuty\",\"your_incident_io_user_id\":\"Твой ID пользователя incident.io\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"Журнал твоей команды всё ещё обменивается — синхронизация каждый раз явно называет ветку\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"Сигнал, которого нет в этом опросе, можно считать восстановившимся.\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"все по нашему хешу формы, который склеивает тревоги, различающиеся лишь числом. Оценивай запомненное исправление с этой поправкой.\",\"at_least_one_source_did_not_answer_this_poll\":\"Хотя бы один источник не ответил на этот опрос.\",\"claim\":\"Взять\",\"claimed\":\"Взят\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· доставляется push-ом, поэтому пустой опрос ничего не значит\",\"every_configured_source_answered\":\"Каждый настроенный источник ответил.\",\"everything_firing_already_has_an_incident\":\"У всего, что срабатывает, уже есть инцидент.\",\"firing\":\"Срабатывает\",\"firing_not_yet_claimed\":\"Срабатывает, ещё не взято\",\"inbound_webhook_queued_few\":\"Доставлено {{count}} входящих сигнала по вебхуку, они ждут, пока их подхватит следующий цикл, — на доске их пока нет.\",\"inbound_webhook_queued_many\":\"Доставлено {{count}} входящих сигналов по вебхуку, они ждут, пока их подхватит следующий цикл, — на доске их пока нет.\",\"inbound_webhook_queued_one\":\"Доставлен {{count}} входящий сигнал по вебхуку, он ждёт, пока его подхватит следующий цикл, — на доске его пока нет.\",\"inbound_webhook_queued_other\":\"Доставлено {{count}} входящих сигнала по вебхуку, они ждут, пока их подхватит следующий цикл, — на доске их пока нет.\",\"inhibited_by_alert_go_look_at_that_alert\":\"Подавлено {{by}} — эту тревогу маскирует более приоритетная; посмотри на неё.\",\"inhibited_by_another_alert_masking_this_one\":\"Подавлено другой тревогой — эту маскирует более приоритетная.\",\"last_poll\":\"Последний опрос\",\"loading\":\"Загрузка...\",\"n_d_ago\":\"{{n}} д назад\",\"n_h_ago\":\"{{n}} ч назад\",\"n_ledger_entries_matched\":\"Совпало записей журнала: {{count}} — {{detail}}\",\"n_m_ago\":\"{{n}} мин назад\",\"n_on_own_identity_exact_match\":\"{{count}} по собственному идентификатору этого провайдера — это точное совпадение.\",\"n_s_ago\":\"{{n}} с назад\",\"n_signals_few\":\"{{count}} signals\",\"n_signals_many\":\"{{count}} signals\",\"n_signals_one\":\"{{count}} signal\",\"n_signals_other\":\"Сигналов: {{count}}\",\"n_similar_lessons_attached_a_near_miss_few\":\"Прикреплено {{count}} похожих урока как контекст — близко, но не совпадение.\",\"n_similar_lessons_attached_a_near_miss_many\":\"Прикреплено {{count}} похожих уроков как контекст — близко, но не совпадение.\",\"n_similar_lessons_attached_a_near_miss_one\":\"Прикреплён {{count}} похожий урок как контекст — близко, но не совпадение.\",\"n_similar_lessons_attached_a_near_miss_other\":\"Прикреплено {{count}} похожих урока как контекст — близко, но не совпадение.\",\"no_attribution_cannot_say_who_parked_it\":\"Этот провайдер не сообщает автора, поэтому мы не можем сказать, кто это отложил и когда оно вернётся.\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"Ни один шаблон не прошёл планку быстрого пути, поэтому агент должен сначала подтвердить, а уже потом предлагать.\",\"no_signal_source_is_configured_so_nothing_was_po\":\"Ни один источник сигналов не настроен, поэтому опрашивать было нечего. Тихая доска пока\\n                ничего не значит — подключи источник в разделе Settings.\",\"no_signal_sources_registered\":\"Источники сигналов не зарегистрированы.\",\"no_sources_reporting_a_firing_signal\":\"Ни один источник не сообщает о сработавшем сигнале.\",\"not_polled_yet_not_the_same_as_healthy\":\"ещё не опрашивался — это не значит, что он здоров\",\"nothing_firing_but_parked_signals_not_investigated\":\"ничего не срабатывает, но отложенные сигналы выше никто не разбирает\",\"nothing_firing_but_signals_parked_not_picked_up_few\":\"Ничего не срабатывает — но {{count}} сигнала отложены у провайдера (см. выше) и взяты не будут.\",\"nothing_firing_but_signals_parked_not_picked_up_many\":\"Ничего не срабатывает — но {{count}} сигналов отложены у провайдера (см. выше) и взяты не будут.\",\"nothing_firing_but_signals_parked_not_picked_up_one\":\"Ничего не срабатывает — но {{count}} сигнал отложен у провайдера (см. выше) и взят не будет.\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"Ничего не срабатывает — но {{count}} сигнала отложены у провайдера (см. выше) и взяты не будут.\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"В журнале ничего не совпало, поэтому расследование начинается с нуля.\",\"nothing_unclaimed\":\"Невзятого нет\",\"one_ledger_entry_matched\":\"Совпала 1 запись журнала — {{detail}}\",\"parked\":\"Отложен\",\"parked_2\":\"отложен\",\"parked_at_the_provider\":\"Отложено у провайдера\",\"poll_answered\":\"ответил\",\"poll_every_configured_source_now_read_only\":\"Опросить сейчас каждый настроенный источник (только чтение)\",\"poll_now\":\"Опросить сейчас\",\"poll_to_see_what_is_firing\":\"Опроси, чтобы увидеть, что срабатывает.\",\"polling\":\"Опрос...\",\"proven_pattern_matched_agent_may_propose_directly\":\"Совпал подтверждённый шаблон, поэтому агент может предложить его исправление напрямую.\",\"provider\":\"Провайдер\",\"push_source_absence_note_few\":\"Сигнал, которого нет в этом опросе, можно считать восстановившимся — КРОМЕ {{sources}}: они доставляют push-ом в буфер, который каждый опрос опустошает, поэтому уже доставленный сигнал больше не появится, срабатывает он ещё или нет.\",\"push_source_absence_note_many\":\"Сигнал, которого нет в этом опросе, можно считать восстановившимся — КРОМЕ {{sources}}: они доставляют push-ом в буфер, который каждый опрос опустошает, поэтому уже доставленный сигнал больше не появится, срабатывает он ещё или нет.\",\"push_source_absence_note_one\":\"Сигнал, которого нет в этом опросе, можно считать восстановившимся — КРОМЕ {{sources}}: он доставляет push-ом в буфер, который каждый опрос опустошает, поэтому уже доставленный сигнал больше не появится, срабатывает он ещё или нет.\",\"push_source_absence_note_other\":\"Сигнал, которого нет в этом опросе, можно считать восстановившимся — КРОМЕ {{sources}}: они доставляют push-ом в буфер, который каждый опрос опустошает, поэтому уже доставленный сигнал больше не появится, срабатывает он ещё или нет.\",\"recovered\":\"восстановился\",\"reported_recovered\":\"Сообщено о восстановлении\",\"signal_sources\":\"Источники сигналов\",\"silenced_by_review_or_let_expire\":\"Заглушено {{by}} — разберись или дай глушению истечь у провайдера.\",\"someone_silenced_these_where_they_came_from_so_t\":\"Кто-то заглушил их там, откуда они пришли, поэтому их никто не разбирает\\n            и инцидент не открывали. Они перечислены потому, что иначе «отложено человеком» и\\n            «приложение это проигнорировало» выглядели бы одинаково.\",\"source\":\"Источник\",\"sources_did_not_answer_this_poll\":\"Источники {{sources}} не ответили на этот опрос.\",\"spool_full_note\":\"Буфер заполнен до предела {{limit}}, поэтому самые старые доставки отбрасываются по мере поступления новых. Запусти цикл на доске Board («Опросить и взять»).\",\"state\":\"Состояние\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"heartbeat берёт по нескольку за цикл, поэтому после всплеска остаётся очередь. Возьми один\\n          сейчас, чтобы начать расследование без ожидания.\",\"the_provider_said_these_are_back_to_normal_unlik\":\"Провайдер сообщил, что здесь всё вернулось в норму. В отличие от сигнала, который просто перестал\\n            появляться, это доказательство, на котором можно закрывать.\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"Этот источник пишет push-ом в буфер, который каждый опрос опустошает, поэтому уже доставленный им сигнал не появится снова, даже если неисправность ещё жива.\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"Откуда берётся работа. Настрой учётные данные и охват в разделе Settings; опроси\\n          здесь, чтобы увидеть, что источник действительно возвращает.\",\"while_that_is_true_absence_of_a_signal_does_not\":\"Пока это так, отсутствие сигнала НЕ значит, что всё восстановилось, — возможно, мы просто\\n                не смогли посмотреть.\",\"firing_count_one\":\"срабатывает: {{count}} ·\",\"firing_count_few\":\"срабатывает: {{count}} ·\",\"firing_count_many\":\"срабатывает: {{count}} ·\",\"firing_count_other\":\"срабатывает: {{count}} ·\",\"parked_count_one\":\"отложено у провайдера: {{count}} ·\",\"parked_count_few\":\"отложено у провайдера: {{count}} ·\",\"parked_count_many\":\"отложено у провайдера: {{count}} ·\",\"parked_count_other\":\"отложено у провайдера: {{count}} ·\",\"cleared_count_one\":\"снято: {{count}} ·\",\"cleared_count_few\":\"снято: {{count}} ·\",\"cleared_count_many\":\"снято: {{count}} ·\",\"cleared_count_other\":\"снято: {{count}} ·\",\"unclaimed_count_one\":\"ещё не взято: {{count}}\",\"unclaimed_count_few\":\"ещё не взято: {{count}}\",\"unclaimed_count_many\":\"ещё не взято: {{count}}\",\"unclaimed_count_other\":\"ещё не взято: {{count}}\"}}}") },
	"zh-CN": { apps: /* @__PURE__ */ JSON.parse("{\"opsMissionControl\":{\"api\":{\"source_health_backing_off\":\"退避中\",\"source_health_failed\":\"失败\",\"source_health_not_polled_yet\":\"尚未轮询\",\"source_health_not_set_up\":\"未设置\",\"the_last_poll_failed\":\"上一次轮询失败。\",\"verification_confirmed_label\":\"已确认\",\"verification_confirmed_meaning\":\"执行 {{verb}} 之后，我们从一个有响应的源重新读取了信号，它已不再报警。\",\"verification_could_not_check_label\":\"无法核实\",\"verification_could_not_check_meaning\":\"复核时间到了，但源没有响应，所以正反两面都说明不了什么。之后的周期会自行重试。\",\"verification_not_checkable_label\":\"已发送，未确认\",\"verification_not_checkable_meaning\":\"{{verb}} 已被接受，但此应用无法观察它是否生效 — 确认操作本来就会让告警继续报警，所以告警状态正反两面都说明不了什么。\",\"verification_pending_label\":\"尚未核实\",\"verification_pending_meaning\":\"{{verb}} 返回了成功，这只表示提供方接受了请求。下一个心跳会重新读取信号，确认它是否生效。\",\"verification_pending_meaning_at\":\"{{verb}} 返回了成功，这只表示提供方接受了请求。{{when}} 之后的下一个心跳会重新读取信号，确认它是否生效。\",\"verification_still_firing_label\":\"此操作后仍在报警\",\"verification_still_firing_meaning\":\"提供方接受了 {{verb}}，而我们再看时信号仍在报警。当初为之开出事件的状况仍然存在。\"},\"handoverPanel\":{\"a_pattern_appears_here_once_the_same_failure_has\":\"同一个故障匹配到两次，模式才会出现在这里 — 只出现一次是事件，不是模式。\",\"applied_and_the_signal_kept_firing_afterwards\":\"已应用，但之后信号仍在报警\",\"at_least_one_source_did_not_answer_the_last_poll\":\"至少有一个源没有响应上一次轮询。\",\"building_the_digest\":\"正在生成摘要…\",\"claimed_by_hand\":\"手动接手\",\"claimed_by_hand_not_the_heartbeat\":\"由人手动接手，不是心跳接手\",\"copied\":\"已复制\",\"copy_as_text\":\"复制为文本\",\"copy_the_digest_as_text_for_a_handover_thread\":\"把摘要复制为文本，用于交接话题\",\"coverage\":\"覆盖范围\",\"derived_from_configuration_only_no_source_has_be\":\"这只是根据配置推断的 — 本次会话还没有轮询过任何源，所以这不能证明其中任何一个有响应。请到“Signals”标签页轮询。\",\"escalated_to_someone_else\":\"已上报给其他人\",\"every_configured_source_answered_the_last_poll\":\"每个已配置的源都响应了上一次轮询。\",\"failed\":\"失败\",\"handed_to_another_owner_so_no_longer_this_app_s\":\"已交给另一位负责人，因此不再是此应用的工作 — 但可能还是要你去催。\",\"handover\":\"交接\",\"no_recurring_patterns_yet\":\"还没有反复出现的模式\",\"not_configured_blind_spots\":\"未配置（盲区）：{{sources}}\",\"nothing_is_being_watched_so_a_quiet_board_means\":\"什么都没在盯着，所以看板安静并不说明任何事情。请在设置中连接一个源。\",\"pattern_proven\":\"已证实\",\"refresh\":\"刷新\",\"refreshing\":\"刷新中…\",\"source_not_answering\":\"{{name}}（无响应）\",\"sources_did_not_answer_the_last_poll\":\"{{sources}} 没有响应上一次轮询。\",\"stopped_with_no_diagnosis\":\"停下了，没有诊断\",\"the_investigation_ended_without_recording_anythi\":\"调查结束时什么都没记录，所以没有可以接下去的线索。这些需要重新开始，而不是回答。\",\"these_do_not_progress_on_their_own_an_unanswered\":\"这些不会自己往前走 — 上一班没有答复的提问，就是这一班的第一件事。\",\"this_fix_was_applied_and_the_signal_was_still_fi\":\"此修复已应用，之后信号仍在报警。不要把它当作答案交接出去 — 要说清楚已经试过什么。\",\"until_that_is_fixed_a_quiet_board_is_not_evidenc\":\"在这一点修好之前，看板安静不能作为已恢复的证据。\",\"waiting_on_you\":\"等你处理\",\"watching_nothing\":\"正在盯着：无\",\"watching_sources\":\"监视中：{{sources}}\",\"what_keeps_happening\":\"反复发生的问题\"},\"incidentChat\":{\"ask_about_incident\":\"询问 {{incidentId}} 的情况…\",\"live_investigation_header\":\"{{incident}}{{title}} 的实时调查。在这里回复即可答复代理或引导它。\"},\"manifest\":{\"use_case_1\":\"监视运维信号、调查事件、复用已验证的修复，并交接完整的本地审计记录。\",\"configuration_1\":\"在设置中使用环境凭据或服务商令牌添加服务商；只读使用时保持 Observe，如需 Propose 或 Act 操作则逐项明确启用；Slack 输出复用现有的 Kiro Crew 连接。\",\"description\":\"一个自主的运维一线响应者。它盯着你的告警、呼叫和监控项，谁在报警就接手谁，带着真实上下文去调查，并给出修复建议 — 学到的东西都记在本地账本里，于是同一个故障第二次出现时比第一次更快解决。\",\"display_name\":\"Ops Mission Control\",\"highlight_1\":\"告警一触发就在一个心跳内接手，在任何人需要去看之前就开始调查\",\"highlight_2\":\"知识账本带置信度和信任级别 — 同一个故障再次出现时，直接用已经掌握的结论解决\",\"highlight_3\":\"实时看板既在仪表板里，也是可回复的 Slack 话题，于是频道就是仪表板\",\"highlight_4\":\"可连接 AWS CloudWatch、PagerDuty、Datadog、incident.io、GitHub Issues，或任何能 POST 签名 JSON 的系统 — 包括 Alertmanager 格式的请求体，每条告警各自展开为一个事件\",\"highlight_5\":\"默认只读 — 写操作按信号模式逐个显式开启，每一次都有审计记录\",\"highlight_6\":\"感知轮值：值班时自动化档位自行开启，不值班时自行关闭\",\"page_label\":\"Mission Control\"},\"opsMissionControlPage\":{\"act\":\"执行\",\"active\":\"进行中\",\"anyone_can_record_those_two_values_so_the_fast_p\":\"× — 这两个值任何人都能记录，因此快速通道还要求至少\",\"approve_and_run\":\"批准并运行\",\"at_least_one_source_did_not_answer_absence_not_recovery\":\"至少有一个源没有响应上一次轮询，所以信号消失并不代表已恢复。\",\"autonomous_first_responder_for_your_alarms_pages\":\"为你的告警、呼叫和监控项提供自主一线响应\",\"awaiting_your_approval\":\"等你批准\",\"board\":\"看板\",\"claiming\":\"接手中…\",\"closed_postmortems\":\"已关闭 — 复盘报告\",\"confidence\":\"置信度\",\"confidence_2\":\"置信度\",\"connect_a_provider_in_settings_to_start_watching\":\"在设置中连接一个提供方即可开始盯守。\",\"copied\":\"已复制\",\"copy_postmortem\":\"复制复盘报告\",\"copy_the_postmortem_exactly_as_written_for_a_tic\":\"按原文复制复盘报告，用于工单或评审\",\"demoted\":\"已降级\",\"demoted_note\":\"已降级：此修复已应用，之后信号仍在报警{{recent}}。保留它是因为偶尔有效的修复也比没有强，但请把它当作已经试过，而不是答案。\",\"demoted_refuted_summary_plural\":\"{{total}} 个条目中有 {{demoted}} 个已被推翻 — 修复应用过，信号却仍在报警。它们不一定都在上方 {{rows}} 行里。\",\"demoted_refuted_summary_singular\":\"{{total}} 个条目中有 {{demoted}} 个已被推翻 — 修复应用过，信号却仍在报警。它不一定在上方 {{rows}} 行里。\",\"drafts_actions_and_asks_nothing_executes_unappro\":\"起草操作并征求同意 — 未获批准的一律不执行\",\"empty_each_investigation_that_finds_a_reusable_f\":\"空的。每次调查只要找到可复用的修复就记在这里，于是同一个故障再次出现时，直接用你已经掌握的结论解决。\",\"every_configured_source_answered_the_last_poll_s\":\"每个已配置的源都响应了上一次轮询，所以这份安静是真的。\",\"executes_actions_granted_by_your_rules_every_one\":\"执行你的规则所授权的操作 — 每一次都有审计记录\",\"expand_the_row_below_for_what_was_attempted_the\":\"展开下面这一行可以看到试过什么。被引用的账本条目已标记为失败。\",\"expires_at_time\":\"{{time}} 过期\",\"failed\":\"失败\",\"failed_2\":\"失败\",\"fast_path\":\"快速通道\",\"fix_label\":\"修复：{{fix}}\",\"hypothesis_agent_must_confirm_first\":\"假设 — 代理必须先确认\",\"is_no_longer_in_the_ledger\":\"已不在账本中。\",\"knowledge_ledger\":\"知识账本\",\"known_patterns\":\"已知模式\",\"leader\":\"负责人\",\"ledger_entry_locked\":\"已锁定\",\"ledger_entry_unlocked\":\"已解锁\",\"loading\":\"加载中…\",\"mark_resolved\":\"标记为已解决\",\"marked_verified_and_high_confidence_but_used_onl\":\"标记为已验证且置信度为高，但只使用过\",\"match_basis\":\"匹配依据\",\"match_basis_exact\":\"{{source}} 为此故障发布了精确身份（{{key}}），账本会优先用它，而不用我们的形状哈希。\",\"matched_entry\":\"匹配到的条目\",\"member_is_this_instance\":\"{{login}}（此实例）\",\"mission_control\":\"Mission Control\",\"mode\":\"运行模式\",\"n_matched\":\"匹配到 {{count}} 个\",\"no_diagnosis_recorded_yet\":\"还没有记录诊断。\",\"no_github_login_resolved_for_this_instance_so_it\":\"没有为此实例解析出 GitHub 登录名，所以它无法判断自己是否在值班。请设置排班文件提供方的 github_login，或给 gh CLI 完成认证。\",\"no_incidents_claimed\":\"没有接手任何事件\",\"no_postmortem_was_written_for_this_incident_inci\":\"此事件没有写过复盘报告。在开始撰写复盘报告之前就已关闭的事件不会有，也没有任何东西去回填 — 那种记录只能凭空编出来。\",\"no_providers_set_up_open_settings_to_connect_one\":\"还没有设置任何提供方 — 打开设置连接一个。\",\"no_source_configured_nothing_polled_connect_one\":\"没有配置任何源，所以什么都没轮询。请在设置中连接一个提供方。\",\"none_matched\":\"没有匹配\",\"not_on_roster_lenient\":\"此实例（{{me}}）没有出现在排班表里。严格门控已关闭，所以它照样会接手工作 — 也就是不会等任何队友。如果想让轮值来决定，请把它加入某个 who: 列表。\",\"not_on_roster_strict\":\"此实例（{{me}}）没有出现在排班表里，所以在严格门控下它永远不会接手工作。请把它加入 rotation.yaml 中的某个 who: 列表，或在设置里改正它的 GitHub 登录名。\",\"nothing_claimed_but_the_board_is_not_verified\":\"没有接手任何事项 — 但看板未经核实\",\"nothing_has_closed_yet_when_an_incident_is_resol\":\"还没有任何事件关闭。事件一旦已解决或已上报，它的复盘报告就写在这里 — 每个事件一个 Markdown 文件，正好可以附到工单上或交给同事。\",\"nothing_is_firing\":\"没有信号在报警\",\"observe\":\"观察\",\"off_shift\":\"不在班\",\"off_shift_who_is_on_call\":\"不在班 — {{who}} 正在值班{{until}}\",\"on_call_now\":\"当前值班\",\"on_call_team\":\"值班团队\",\"on_shift\":\"值班中{{until}}\",\"on_shift_who\":\"值班中：{{who}}{{until}}\",\"open_in_provider\":\"在提供方中打开\",\"pattern\":\"模式\",\"patterns_known\":\"已知模式数\",\"patterns_proven\":\"已证实模式数\",\"poll_and_claim\":\"轮询并接手\",\"poll_every_configured_source_now_and_claim_anyth\":\"立即轮询每个已配置的源，并接手所有新出现的信号\",\"polled_summary_other\":\"已轮询到 {{polled}} 个正在报警的信号；没有新的可以接手。\",\"polled_summary_with_parked_other\":\"已轮询到 {{polled}} 个正在报警的信号，另有 {{suppressed}} 个在提供方处挂起、未做处理；没有新的可以接手。\",\"propose\":\"提议\",\"proven_agent_may_propose_directly\":\"已证实 — 代理可以直接提议\",\"read_only_nothing_is_written_to_any_provider\":\"只读 — 不向任何提供方写入\",\"reading_the_postmortem\":\"正在读取复盘报告…\",\"reject\":\"拒绝\",\"replies_in_the_slack_thread_reach_this_investiga\":\"在 Slack 话题里回复会送到此调查。\",\"replies_in_the_slack_thread_will_not_reach_this\":\"在 Slack 话题里回复不会送到此调查 — 请改在下面的聊天里作答。\",\"resource\":\"资源\",\"rotation_unknown_not_picking_up_work\":\"轮值未知 — 不接手工作\",\"rotation_unknown_tier_armed\":\"轮值未知 — 档位已开启\",\"runs_nightly_ledger_hygiene_for_the_team\":\"为团队执行每晚的账本清理\",\"schedule_problem\":\"排班表有问题：{{error}}\",\"sent\":\"已发送\",\"sent_n_ago\":\"{{age}} 前发送\",\"shift_other\":\"{{count}} 个班次\",\"showing_closed_incidents_other\":\"显示 {{count}} 个已关闭事件，范围为最近\",\"showing_n_of_total\":\"共 {{total}} 个，显示 {{shown}} 个 — 更早的在磁盘上，但不在此列表中\",\"source\":\"信号源\",\"source_health_not_verified_poll_from_signals_tab\":\"本次会话还没有核实过源的健康状况 — 请到“Signals”标签页轮询，确认这份安静是真的。\",\"sources_did_not_answer_absence_not_recovery\":\"{{sources}} 没有响应上一次轮询，所以信号消失并不代表已恢复。\",\"sources_wired\":\"已接入的源\",\"status_dispatched\":\"已派发\",\"status_escalated\":\"已上报\",\"status_investigating\":\"调查中\",\"status_needs_human\":\"需要人工\",\"status_resolved\":\"已解决\",\"status_stale\":\"已过时\",\"status_unclaimed\":\"未接手\",\"tab_board\":\"看板\",\"tab_handover\":\"交接\",\"tab_settings\":\"设置\",\"tab_signals\":\"信号\",\"the_decision_was_refused\":\"此决定被拒绝。\",\"this_fix_was_applied_and_the_signal_kept_firing\":\"此修复已应用，之后信号仍在报警\",\"this_provider_published_no_exact_identity_so_any\":\"此提供方没有发布精确身份，所以任何账本匹配都来自我们的形状哈希 — 这是一种启发式做法，会把只差一个数字的告警合并，比如同一资源上 4xx 和 5xx 两个比率。据此权衡记下来的修复。\",\"through_sink\":\"经由 {{sink}}\",\"through_sink_for_duration\":\"通过 {{sink}}，为期 {{duration}}\",\"timezone_only_on_call_instance_picks_up_work\":\"{{timezone}} · 只有值班中的实例才接手工作\",\"trust\":\"信任\",\"unlocked_means_an_investigation_may_propose_this\":\"“已解锁”意味着调查可以直接提议此修复，而不必重新推导一遍 — 这需要同时满足四项：信任级别为已验证、置信度为高、使用次数至少\",\"until_shift_end\":\"至 {{end}}\",\"used\":\"已用\",\"used_2\":\"已用\",\"uses_and_no_recorded_failure_a_locked_entry_is_s\":\"次，且没有失败记录。已锁定的条目仍会完整交给代理，只是会要求它先确认。已降级的条目是试过之后信号仍在报警，这比一个未经验证的猜测更值得警惕。\",\"uses_before_an_agent_proposes_it_without_checkin\":\"次使用，代理才能不经核对就直接提议。\",\"verification_failed_many\":\"此应用报告操作已应用之后，我们重新读取时有 {{count}} 个事件仍在报警（{{ids}}）。\",\"verification_failed_one\":\"此应用报告该操作已应用之后，我们重新读取时 {{id}} 仍在报警。\",\"waiting_awaiting_approval\":\"批准后继续\",\"waiting_awaiting_diagnosis\":\"已停下，没有诊断\",\"waiting_awaiting_input\":\"等你处理\",\"waiting_on_you\":\"等你处理\"},\"settingsPanel\":{\"a_pattern_is_required_there_is_no_wildcard_grant\":\"必须填写模式 — 没有通配授权。用 * 匹配前缀，例如 prod-* 覆盖所有名称以 prod- 开头的资源。\",\"act_needs_both_the_mode_above_and_a_rule_that_ma\":\"执行需要同时满足两点：上方的模式选择，以及一条匹配此信号的规则。只设模式本身不授予任何权限。\",\"act_only_takes_effect_for_signals_matched_by_a_r\":\"执行只对你写过的规则所匹配的信号生效。没有规则时，它的行为和提议一样。\",\"act_rules\":\"执行规则\",\"active\":\"已启用\",\"all_actions\":\"所有操作\",\"an_incident_waiting_on_you_gets_the_longer_windo\":\"等你处理的事件会有更长的窗口 — 你在睡觉和代理崩溃不是一回事。\",\"autonomy\":\"自主程度\",\"branch\":\"分支\",\"c0123456789\":\"C0123456789\",\"channel_id\":\"频道 ID\",\"channel_when_incident_released\":\"闲置的调查释放出来供重新接手时触发。\",\"channel_when_source_health\":\"在某个源开始不响应的那一次轮询时触发 — 只要它一直不通，就不会再触发。\",\"channel_when_waiting_on_you\":\"事件一开始等人处理就立刻触发。\",\"choose_a_source\":\"选择一个源\",\"cli\":\"CLI.\",\"companions_installed_other\":\"已安装 {{count}} 个适配器包：{{names}}。通过准入后，它们的源就会出现在上方列表里；如果没有出现，说明机群准入策略拒绝了它们 — 请查看网关日志。\",\"connect_a_signal_source_first_a_rule_naming_an_u\":\"请先连接一个信号源 — 指定了未配置提供方的规则永远不会匹配。\",\"credential_retention_note\":\"保存在此应用的文件夹之外，所以代理读不到。注意：卸载此应用并不会删除它们。想彻底清掉凭据，请先在这里撤销。\",\"desktop_notifications\":\"桌面通知\",\"detached_head\":\"detached HEAD\",\"detached_head_left_alone_finish_the_merge_first\":\"detached HEAD 是故意不去动的：请先完成或中止正在进行的 merge 或 rebase，因为在这种状态下移动引用会丢掉那部分工作。\",\"enable_provider\":\"启用 {{provider}}\",\"exchange_happens_on_the_nightly_maintenance_pass\":\"交换只发生在每晚的维护过程中 — 不是每个事件一次。它只在开启了“每晚账本维护”的那个实例上运行（见下方“实例”）。关掉此项的实例永远不会拉取，只会用手上已有副本，包括它最后看到的那份\",\"expected_shape_label\":\"预期格式\",\"explicitly_every_time_what_does_not_work_is\":\"分支。行不通的是\",\"find_it_at_the_bottom_of_the_channel_s_detail_di\":\"在 Slack 里打开频道详情对话框，它在最下面。请先把 {{productName}} 机器人邀请进频道，否则发送会失败。\",\"get_a_notification_when_something_changes_that_n\":\"有需要你处理的变化时收到通知 — 不需要 Slack 工作区，也不需要任何凭据。通知会送到 {{productName}} 的通知中心和你的桌面。\",\"gh\":\"gh\",\"git_github_com_your_org_ops_memory_git\":\"git@github.com:your-org/ops-memory.git\",\"git_pull_or_push\":\"git pull / push\",\"github_login_help\":\"此实例在 {{whoKey}} 中如何识别自己。留空则使用本地 {{ghCli}} CLI 已认证的登录名。\",\"grant\":\"授权\",\"heartbeat_pacing\":\"心跳节奏\",\"how_much_the_heartbeat_picks_up_at_once_and_how\":\"心跳一次接手多少，以及等多久才把工作交回去。释放一个事件并不等于解决它 — 信号会重新变得可以接手，于是代理已经死掉的调查会被重试，而不是让告警一直挂着。\",\"in_force_now\":\"当前生效值\",\"instance\":\"实例\",\"interrupts_by_default\":\"· 默认会打断\",\"is_not_named_in_any_shift_and_strict_gating_is_o\":\"没有出现在任何班次里，而严格门控已关闭 — 所以此实例不管排班如何都会接手工作，也不会让位给正在值班的人。请把它加入某个\",\"is_not_named_in_any_shift_so_under_strict_gating\":\"没有出现在任何班次里，所以在严格门控下此实例永远不会接手工作。请把它加入某个\",\"is_resolved_by_hand_in_the_repo_publishing_a_sch\":\"在仓库里被手工解决冲突 — 发布一份满是冲突标记的排班表，会让每个队友都读不出谁在值班。\",\"it_last_saw\":\"副本。\",\"leave_this_on_if_you_are_the_only_one_running_op\":\"如果只有你一个人在跑 Ops Mission Control，就保持开启。多人共用一个账本时，应该只有一个实例做主实例，这样维护过程才不会每人各跑一次。\",\"ledger_conflict\":\"账本冲突\",\"ledger_intro\":\"你们团队的知识账本，通过普通 git 仓库交换：{{file}} 由每晚维护过程拉取和推送。\",\"list_if_the_rotation_is_meant_to_decide_who_resp\":\"列表，让轮值来决定由谁响应。\",\"list_or_correct_the_login_above\":\"列表，或改正上方的登录名。\",\"loading\":\"加载中…\",\"main\":\"main\",\"min\":\"分钟\",\"mirror_incidents_to_a_channel_as_a_live_board_on\":\"把事件镜像到一个频道，做成实时看板：每个事件一条消息，状态就地更新，诊断放在它的话题里。使用 {{productName}} 已有的 Slack 连接 — 此应用自己不保存任何 Slack token。\",\"mirror_incidents_to_slack\":\"把事件镜像到 Slack\",\"mode_act_label\":\"执行\",\"mode_help_act\":\"对你用规则显式加入允许列表的信号模式执行操作。规则必须指定一个源和一个资源模式 — 没有“全部”这种规则。每一次执行都有审计记录。\",\"mode_help_observe\":\"读取信号并展开调查。不向任何提供方写入。这是默认设置，也是稳妥的起点。\",\"mode_help_propose\":\"观察能做的一切，再加上起草确认 / 解决 / 评论操作，并先问你一句。未获批准的一律不执行。\",\"mode_observe_label\":\"观察\",\"mode_propose_label\":\"提议\",\"needs_human_derived\":\"当前为 {{value}}，由上方的窗口推算而来，所以上面一变它也跟着变。在这里设置就会把它固定住。\",\"needs_human_pinned\":\"固定在 {{value}}，与上方窗口无关。\",\"needs_setup\":\"需要设置\",\"new_claims_per_heartbeat\":\"每个心跳新接手的数量\",\"next_sync_moves_it_across_unless_a_branch_exists\":\"下一次同步会自己把它迁过去，除非已经存在同名的另一个分支 — 那时它会拒绝，而不是替你选择保留哪段历史，上方消息会写明该运行哪个 merge。\",\"no_branch_detached_head\":\"无分支（detached HEAD）\",\"no_credential_note\":\"不需要填任何凭据：同步以你的身份运行 {{gitCmd}}，用你自己的 SSH 密钥或凭据助手。建议用 SSH 远端（{{sshRemote}}） — 千万不要粘贴带 token 的 URL，因为此应用的设置文件不登录也能读。分支留空则用 {{defaultBranch}}。\",\"no_github_login_resolved_for_this_instance_so_it\":\"没有为此实例解析出 GitHub 登录名，所以它无法判断自己是否在值班。请在上方填一个，或去认证\",\"no_rules_yet_add_one_below_to_grant_authority_fo\":\"还没有规则 — 在下面添加一条，为特定的一组资源授权。\",\"not_reported_by_this_gateway_so_the_values_in_fo\":\"此网关没有上报，所以无法显示当前生效的值。\",\"not_set\":\"未填写\",\"not_set_up\":\"未设置\",\"notify_me_on_state_changes\":\"状态变化时通知我\",\"off\":\"已关闭\",\"on_call_schedule\":\"值班排班表\",\"one_notification_per_state_change_never_per_hear\":\"每次状态变化通知一次，绝不按心跳通知：一直不通的源只报一次，而不是每两分钟报一次。同一事件的重复通知会堆叠成一行。\",\"only_the_on_call_instance_picks_up_work\":\"只有值班中的实例才接手工作\",\"pagerduty_user_id_help\":\"用来与 PagerDuty 报告的值班人比对，这样此实例就能判断呼叫是不是给你的。保存在代理碰不到的地方 — 留空则把排班表上任何人都当成你。\",\"incidentio_user_id_help\":\"用来与 incident.io 排班表上的用户比对，这样此实例就能判断这个班次是不是你的。保存在代理碰不到的地方 — 留空则把排班表上任何人都当成你。 已设置 ID 但未配置排班表时，此实例将保持非值班状态。\",\"identity_save_refused\":\"你的 ID 未保存 — 设置存储拒绝了本次写入。请重试。\",\"change_save_refused\":\"你的更改未保存 — 设置存储拒绝了本次写入。请重试。\",\"value_too_long_refused\":\"该值过长，因此未保存。\",\"prod_star\":\"prod-*\",\"providers\":\"提供方\",\"pushes_stay_refused_until\":\"推送会一直遭拒，直到\",\"quiet_and_expires_on_its_own\":\"· 安静，且会自行过期\",\"ready\":\"就绪\",\"release_a_question_after\":\"多久后释放提问\",\"release_an_investigation_after\":\"多久后释放调查\",\"remote\":\"远程\",\"replace\":\"替换\",\"repository\":\"仓库\",\"resolved_from_the_gh_cli_when_blank\":\"留空时从 gh CLI 解析\",\"resource_pattern\":\"资源模式\",\"revoke_rule\":\"撤销规则\",\"revoke_stored_credentials\":\"撤销已保存的凭据\",\"rotation_yaml\":\"rotation.yaml\",\"run_by_hand_in_the_ledger_directory_because_this\":\"在账本目录里手动执行，因为此分支没有上游。\",\"run_nightly_ledger_maintenance_on_this_instance\":\"在此实例上运行每晚的账本维护\",\"save\":\"保存\",\"schedule_conflict\":\"排班表冲突\",\"schedule_location_note\":\"这里没有路径可选：排班表就是一个 {{schedule}}，和 {{ledger}} 一起提交到上方的仓库。位置故意固定下来，因为每个实例都要读的轮值表，必须放在每个实例都会去看的位置。\",\"share_the_knowledge_ledger_with_my_team\":\"与我的团队共享知识账本\",\"shared_team_memory\":\"团队共享记忆\",\"sharing_is_not_set_up_above_so_the_schedule_is_w\":\"上方没有设置共享，所以排班表就是这台机器上现有的那份，谁也看不到。\",\"signal_source\":\"信号源\",\"slack\":\"Slack\",\"stored_enter_a_new_value_to_replace\":\"已保存 — 输入新值可替换\",\"strict_off_explanation\":\"排班表无法确定你是否值班时，此实例照样干活 — 别的实例也一样，于是两个队友可能对同一条告警同时动手。只在单人安装时才建议这样。\",\"strict_on_explanation\":\"排班表无法确定你是否值班时，此实例就退下不做。正是这一点保证同一条告警只有一个队友在处理。\",\"syncing\":\"同步中\",\"the_maximum_this_instance_may_do_a_per_signal_ru\":\"此实例最多能做到什么。按信号的规则只能收窄它，绝不能放宽 — 所以保持在观察，无论存在什么规则，此应用都只读。\",\"this_repo_is_on\":\"此仓库当前在\",\"to_silence_one_of_these_without_turning_the_rest\":\"想只静默其中一项而不关掉其余 — 或者调整它打扰的强度 — 请用设置 → 通知，那里列出了每个应用渠道。渠道会在第一次触发之后出现在那里。\",\"turn_on_the_systems_you_want_watched_aws_uses_yo\":\"打开你想盯守的系统。AWS 用你现有的凭据 — 不保存任何密钥。其他提供方的 token 存在代理读不到的地方。\",\"unavailable_here\":\"此处不可用\",\"when_a_state_changes\":\"状态变化时\",\"who\":\"who\",\"wrong_local_branch\":\"本地分支不对\",\"your_github_login\":\"你的 GitHub 登录名\",\"your_pagerduty_user_id\":\"你的 PagerDuty 用户 ID\",\"your_incident_io_user_id\":\"你的 incident.io 用户 ID\",\"your_team_s_ledger_is_still_being_exchanged_sync\":\"你们团队的账本仍在交换 — 同步每次都会显式指定\"},\"signalsPanel\":{\"a_signal_that_is_absent_from_this_poll_can_be_re\":\"这次轮询里没出现的信号可以视为已恢复。\",\"all_on_shape_hash_weigh_the_fix_accordingly\":\"全部基于我们的形状哈希，它会把只差一个数字的告警合并。据此权衡记下来的修复。\",\"at_least_one_source_did_not_answer_this_poll\":\"至少有一个源没有响应这次轮询。\",\"claim\":\"接手\",\"claimed\":\"已接手\",\"delivered_by_push_so_an_empty_poll_means_nothing\":\"· 由推送投递，所以轮询为空并不说明什么\",\"every_configured_source_answered\":\"每个已配置的源都有响应。\",\"everything_firing_already_has_an_incident\":\"当前所有在报警的信号都已经有对应事件。\",\"firing\":\"报警中\",\"firing_not_yet_claimed\":\"正在报警，尚未接手\",\"inbound_webhook_queued_other\":\"已投递 {{count}} 个入站 webhook 信号，正等下一个周期接手 — 它们还没上看板。\",\"inhibited_by_alert_go_look_at_that_alert\":\"被 {{by}} 抑制 — 有一条更高优先级的告警把它盖住了；去看那条告警。\",\"inhibited_by_another_alert_masking_this_one\":\"被另一条告警抑制 — 有一条更高优先级的告警把它盖住了。\",\"last_poll\":\"上一次轮询\",\"loading\":\"加载中…\",\"n_d_ago\":\"{{n}} 天前\",\"n_h_ago\":\"{{n}} 小时前\",\"n_ledger_entries_matched\":\"匹配到 {{count}} 个账本条目 — {{detail}}\",\"n_m_ago\":\"{{n}} 分钟前\",\"n_on_own_identity_exact_match\":\"有 {{count}} 个基于此提供方自己的身份，属于精确匹配。\",\"n_s_ago\":\"{{n}} 秒前\",\"n_signals_other\":\"{{count}} 个信号\",\"n_similar_lessons_attached_a_near_miss_other\":\"附上了 {{count}} 条相似经验作为上下文 — 只是接近，不是匹配。\",\"no_attribution_cannot_say_who_parked_it\":\"此提供方没有发布归属信息，所以我们说不出是谁把它挂起的、什么时候会回来。\",\"no_pattern_cleared_fast_path_agent_must_confirm\":\"没有模式达到快速通道的门槛，所以代理必须先确认再提议。\",\"no_signal_source_is_configured_so_nothing_was_po\":\"没有配置信号源，所以什么都没轮询。此时看板安静还说明不了什么 — 请在设置中连接一个源。\",\"no_signal_sources_registered\":\"没有注册任何信号源。\",\"no_sources_reporting_a_firing_signal\":\"没有任何源报出正在报警的信号。\",\"not_polled_yet_not_the_same_as_healthy\":\"尚未轮询 — 这和健康不是一回事\",\"nothing_firing_but_parked_signals_not_investigated\":\"没有信号在报警，但上方挂起的信号没有人在调查\",\"nothing_firing_but_signals_parked_not_picked_up_other\":\"没有信号在报警 — 但有 {{count}} 个信号在提供方处挂起（见上方），不会被接手。\",\"nothing_in_the_ledger_matched_starts_from_scratch\":\"账本里没有匹配项，所以调查要从零开始。\",\"nothing_unclaimed\":\"没有未接手的项\",\"one_ledger_entry_matched\":\"匹配到 1 个账本条目 — {{detail}}\",\"parked\":\"已挂起\",\"parked_2\":\"已挂起\",\"parked_at_the_provider\":\"在提供方处挂起\",\"poll_answered\":\"已响应\",\"poll_every_configured_source_now_read_only\":\"立即轮询每个已配置的源（只读）\",\"poll_now\":\"立即轮询\",\"poll_to_see_what_is_firing\":\"轮询一下，看看有什么在报警。\",\"polling\":\"轮询中…\",\"proven_pattern_matched_agent_may_propose_directly\":\"匹配到一个已证实的模式，所以代理可以直接提议它的修复。\",\"provider\":\"提供方\",\"push_source_absence_note_other\":\"这次轮询里没出现的信号可以视为已恢复，但 {{sources}} 例外 — 它们用推送投递到一个暂存队列，而每次轮询都会清空该队列，所以已经投递过的信号不会再出现，无论它是否还在报警。\",\"recovered\":\"已恢复\",\"reported_recovered\":\"已报告恢复\",\"signal_sources\":\"信号源\",\"silenced_by_review_or_let_expire\":\"被 {{by}} 静默 — 去复核，或让静默在提供方处自然过期。\",\"someone_silenced_these_where_they_came_from_so_t\":\"有人在来源那一侧把它们静默了，所以没有人在调查，也没有开出事件。列在这里是因为“有人挂起”和“应用忽略了它”否则看起来一模一样。\",\"source\":\"信号源\",\"sources_did_not_answer_this_poll\":\"{{sources}} 没有响应这次轮询。\",\"spool_full_note\":\"暂存队列已满，上限是 {{limit}}，所以新的投递进来时最老的会被丢掉。请从看板运行一轮（“轮询并接手”）。\",\"state\":\"状态\",\"the_heartbeat_claims_a_few_per_cycle_so_a_burst\":\"心跳每个周期只接手几个，所以一波突增会留下队列。现在手动接手一个，就能立刻开始它的调查，不用等。\",\"the_provider_said_these_are_back_to_normal_unlik\":\"提供方说这些已经恢复正常。这和只是不再出现的信号不同，它是可以据以解决的证据。\",\"this_source_pushes_to_a_spool_that_each_poll_emp\":\"此源推送到一个暂存队列，而每次轮询都会清空该队列，所以它已经投递过的信号不会再出现，即使故障仍然存在。\",\"title_resource_tooltip\":\"{{title}}\\n{{resource}}\",\"where_work_comes_from_configure_credentials_and\":\"工作从哪里来。在设置中配置凭据和范围；在这里轮询就能看到一个源实际返回什么。\",\"while_that_is_true_absence_of_a_signal_does_not\":\"在这种情况下，信号消失并不代表已恢复 — 可能只是我们没能去看。\",\"firing_count_other\":\"{{count}} 个报警中 ·\",\"parked_count_other\":\"{{count}} 个在提供方处挂起 ·\",\"cleared_count_other\":\"{{count}} 个已恢复 ·\",\"unclaimed_count_other\":\"{{count}} 个尚未接手\"}}}") }
};
var own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function lookup(catalog, key) {
	let node = catalog;
	for (const part of key.split(".")) {
		if (node === void 0 || typeof node === "string" || !own(node, part)) return void 0;
		node = node[part];
	}
	return typeof node === "string" ? node : void 0;
}
/** The catalogs to try for `locale`, most specific first, always ending in English. */
function localeChain(locale) {
	const chain = [];
	const add = (candidate) => {
		if (own(CATALOGS, candidate) && !chain.includes(candidate)) chain.push(candidate);
	};
	add(locale);
	add(locale.split("-")[0]);
	add("en");
	return chain;
}
function currentLocale() {
	try {
		const locale = activeLocale();
		return typeof locale === "string" && locale ? locale : "en";
	} catch {
		return "en";
	}
}
var PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;
function pluralForm(locale, count) {
	try {
		return new Intl.PluralRules(locale).select(count);
	} catch {
		return count === 1 ? "one" : "other";
	}
}
function t(key, vars) {
	const count = vars && typeof vars.count === "number" ? vars.count : void 0;
	for (const locale of localeChain(currentLocale())) {
		const catalog = CATALOGS[locale];
		let text;
		if (count !== void 0) text = lookup(catalog, `${key}_${pluralForm(locale, count)}`) ?? lookup(catalog, `${key}_other`);
		text = text ?? lookup(catalog, key);
		if (text !== void 0) return text.replace(PLACEHOLDER, (whole, name) => vars && own(vars, name) ? String(vars[name]) : whole);
	}
	return key;
}
/** The dashboard's name for this helper, so the ported call sites read unchanged. */
var i18nT = t;
// src/format.ts
/**
* The two dashboard formatters the page uses that the App Kit SDK does not export,
* restated over the SDK's own `fmtNumber` and `activeLocale` so they render in the
* host's active language, exactly as the built-in's `i18n/format` helpers did.
*/
/** A quantity with a narrow unit (`5s`, `3 h`); never broken between number and unit. */
function fmtUnit(value, unit, options) {
	if (!Number.isFinite(value)) return "—";
	return fmtNumber(value, {
		style: "unit",
		unit,
		unitDisplay: "narrow",
		...options
	}).replace(/ /g, "\xA0");
}
/** Below this a number is epoch SECONDS, as the dashboard's `toDate` reads it. */
var SECONDS_CEILING = 1e11;
function toDate(value) {
	if (value === null || value === void 0 || value === "") return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "number") {
		if (!Number.isFinite(value) || value <= 0) return null;
		const d = new Date(value < SECONDS_CEILING ? value * 1e3 : value);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}
/** A date rendered from explicit fields (`{ hour: '2-digit', minute: '2-digit' }`). */
function fmtDateFields(value, options) {
	const d = toDate(value);
	if (!d) return "—";
	let locale = "en";
	try {
		locale = activeLocale() || "en";
	} catch {}
	return new Intl.DateTimeFormat(locale, {
		localeMatcher: "lookup",
		...options
	}).format(d);
}
// src/api.ts
var API = "/api/apps/ops-mission-control";
/**
* React Query key for `/signals`, shared rather than re-declared per panel.
*
* Exported because three surfaces need the SAME cache entry: the Signals tab (which owns
* the fetch, on an explicit button press) and the Board + Handover panels, which read it
* with `enabled: false`. Polling every configured source costs real money and rate-limit
* budget, so a second key would mean a second paid poll fired by merely looking at the
* board — see `opsApi.signals`.
*/
var SIGNALS_QUERY_KEY = ["ops-mission-control", "signals"];
/**
* Whether a provider error is the throttle notice rather than a real failure.
*
* A PREDICATE, not a prefix constant. The literal it matches is the wire text
* `registry.poll_all` emits for a skipped-because-throttled poll (`backend/registry.py`) —
* text this code compares against and never renders, so translating it would break the
* match. Holding it in an ALL-CAPS constant put it where `eslint-plugin-i18next` cannot see
* it (those are exempt by default) and the strict wrapper then flagged it with no shape
* narrow enough to exempt without also exempting real two-word copy. Inside `startsWith` it
* is a comparison operand, which the callee exclusion covers by shape.
*/
function isBackoffNotice(err) {
	return err.toLowerCase().startsWith("backing off");
}
/**
* Collapse (`poll_health`, `errors`, `configured`) into the one state a row should show.
*
* Lives in api.ts rather than in a panel because the Board, the Signals tab and the
* Handover digest all have to answer "is this source actually watching?" and must not word
* it three different ways — the same argument the backend already makes by pre-rendering
* `HandoverDigest.text`.
*
* `backing_off` is detected by sniffing the start of the error string, because the backend
* reports a throttled skip only as prose (`registry.poll_all`'s `_poll_one` is the sole
* producer). That is deliberately a soft check: if the message is ever reworded this
* degrades to plain `failed`, which is still true and still red — it never degrades to
* `ok`, which would be a lie.
*/
/**
* Operator-facing wording for `blocked_reason`, shared by every surface that shows it.
*
* Lives here rather than in the board because the board and the handover digest render the
* SAME field and had drifted: the board mapped `awaiting_approval` to "Approve to
* continue", while the handover printed the raw enum with underscores swapped for spaces
* ("awaiting approval"). An incoming responder reading the handover therefore could not
* match a row to the board row they were inheriting — at a shift change, which is the one
* moment the digest exists for.
*
* A shared constant rather than two correct-looking maps: the failure mode of duplication
* here is silent, because each surface reads fine on its own and only the comparison is
* wrong.
*/
var BLOCKED_LABEL_KEY = {
	awaiting_approval: "apps.opsMissionControl.opsMissionControlPage.waiting_awaiting_approval",
	awaiting_input: "apps.opsMissionControl.opsMissionControlPage.waiting_awaiting_input",
	awaiting_diagnosis: "apps.opsMissionControl.opsMissionControlPage.waiting_awaiting_diagnosis"
};
/** `BLOCKED_LABEL_KEY` resolved, with a readable fallback so an unmapped future reason still
* prints. Catalog keys rather than English literals: an ALL-CAPS module constant is exempt
* from `eslint-plugin-i18next`, so the literals shipped untranslated with no gate to catch
* it. Both call sites go through this function or the map, so resolution stays in one place. */
/** Whether `BLOCKED_LABEL_KEY` has real copy for this reason, as opposed to the
* underscore-stripped fallback. Exported so a caller can branch on "is this a reason we
* have wording for" without indexing the map across a module boundary — `check-i18n-keys`
* resolves an `as const` map only in the file that declares it. */
function isKnownBlockedReason(reason) {
	return !!reason && reason in BLOCKED_LABEL_KEY;
}
function blockedLabel(reason) {
	if (!reason) return "";
	if (!isKnownBlockedReason(reason)) return reason.replace(/_/g, " ");
	return i18nT(BLOCKED_LABEL_KEY[reason]);
}
function describeSourceHealth(id, health, errors, configured) {
	const err = errors?.[id] ?? "";
	const entry = health?.[id];
	if (isBackoffNotice(err)) return {
		state: "backing_off",
		label: i18nT("apps.opsMissionControl.api.source_health_backing_off"),
		variant: "warn",
		detail: err,
		at: entry?.at ?? "",
		contributing: false,
		absenceIsEvidence: false
	};
	if (err || entry?.ok === false) return {
		state: "failed",
		label: i18nT("apps.opsMissionControl.api.source_health_failed"),
		variant: "err",
		detail: err || entry?.detail || i18nT("apps.opsMissionControl.api.the_last_poll_failed"),
		at: entry?.at ?? "",
		contributing: false,
		absenceIsEvidence: false
	};
	if (!configured) return {
		state: "not_set_up",
		label: i18nT("apps.opsMissionControl.api.source_health_not_set_up"),
		variant: "muted",
		detail: "",
		at: "",
		contributing: false,
		absenceIsEvidence: false
	};
	if (!entry) return {
		state: "not_polled",
		label: i18nT("apps.opsMissionControl.api.source_health_not_polled_yet"),
		variant: "muted",
		detail: "",
		at: "",
		contributing: false,
		absenceIsEvidence: false
	};
	return {
		state: "ok",
		label: "ok",
		variant: "ok",
		detail: "",
		at: entry.at,
		contributing: true,
		absenceIsEvidence: entry.snapshot !== false
	};
}
function describeVerification(incident) {
	const verdict = incident.verification || "";
	const verb = incident.last_action || "action";
	switch (verdict) {
		case "still_firing": return {
			label: i18nT("apps.opsMissionControl.api.verification_still_firing_label"),
			variant: "err",
			meaning: i18nT("apps.opsMissionControl.api.verification_still_firing_meaning", { verb })
		};
		case "cleared": return {
			label: i18nT("apps.opsMissionControl.api.verification_confirmed_label"),
			variant: "ok",
			meaning: i18nT("apps.opsMissionControl.api.verification_confirmed_meaning", { verb })
		};
		case "pending": return {
			label: i18nT("apps.opsMissionControl.api.verification_pending_label"),
			variant: "muted",
			meaning: incident.verify_after ? i18nT("apps.opsMissionControl.api.verification_pending_meaning_at", {
				verb,
				when: incident.verify_after
			}) : i18nT("apps.opsMissionControl.api.verification_pending_meaning", { verb })
		};
		case "unknown": return {
			label: i18nT("apps.opsMissionControl.api.verification_could_not_check_label"),
			variant: "warn",
			meaning: i18nT("apps.opsMissionControl.api.verification_could_not_check_meaning")
		};
		case "not_checkable": return {
			label: i18nT("apps.opsMissionControl.api.verification_not_checkable_label"),
			variant: "warn",
			meaning: i18nT("apps.opsMissionControl.api.verification_not_checkable_meaning", { verb })
		};
		default: return null;
	}
}
function entryIsProven(entry) {
	return entry.trust === "verified" && entry.confidence === "high" && entry.use_count >= 2 && entry.miss_count === 0;
}
/**
* A non-2xx backend response. `code` is the machine-readable refusal code the
* error contract requires on every error body (`policy_store_unwritable`, ...),
* so a caller can swap the raw reason for task vocabulary without string-matching
* on `message` — which for an `OSError`-backed 503 is `str(exc)` and not
* something an operator should have to parse.
*/
var OpsApiError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = "OpsApiError";
	}
};
/** The server's `error` sentence and `code` out of a refusal body, else `HTTP <status>`. */
function refusal(status, body) {
	let detail = `HTTP ${status}`;
	let code;
	try {
		const parsed = JSON.parse(body);
		if (parsed?.error) detail = parsed.error;
		if (typeof parsed?.code === "string") code = parsed.code;
	} catch {}
	return new OpsApiError(detail, code);
}
/**
* One request through the host's scoped client (`useAppApi().raw`), which refuses a
* path outside `permissions.api` in the browser and throws `{status, body}` on a
* non-2xx. The refusal is surfaced with the backend's reason — a 403 here is usually
* the autonomy gate explaining that no rule grants this action, which the user needs
* to read.
*/
async function req(path, init) {
	let resp;
	try {
		resp = await currentAppApi().raw(`${API}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...init?.headers ?? {}
			}
		});
	} catch (e) {
		const status = e?.status;
		if (typeof status === "number") throw refusal(status, String(e.body ?? ""));
		throw e;
	}
	return await resp.json();
}
var opsApi = {
	state: () => req("/state"),
	/**
	* The board's incident list. Server-capped at 200 — `truncated` and `total` are
	* present ONLY when there was more, so the UI can say "showing 200 of 640" instead
	* of implying the list is complete. Typed rather than ignored: a silently clipped
	* board is how someone concludes an incident vanished.
	*
	* Its caller is the Board's "Closed — postmortems" section. `/state` returns only OPEN
	* incidents, so a closed one leaves the board entirely and this is the only route that
	* can find it again — which is also why the section exists: without it, the artifact
	* written at close had nowhere to be read. The `status` filter takes ONE status while
	* "closed" is two (resolved and escalated), so that caller passes none and filters
	* client-side; the cap therefore applies across all statuses, which is why `truncated`
	* has to be rendered rather than assumed away.
	*/
	incidents: (status) => req(`/incidents?${new URLSearchParams(status ? { status } : {}).toString()}`),
	/**
	* One incident plus its rendered postmortem.
	*
	* `log` is the Markdown artifact the backend writes when the incident reaches a terminal
	* status, redacted at the write (both the core credential/exfil pass and the app's
	* provider-token pass). It is the only thing this app produces that a reader who does
	* not run Kiro Crew can be handed, which is why it is worth a round trip.
	*
	* It is EMPTY in two different situations and the UI must not render them the same way:
	* an incident that is still open has no artifact yet, and one that closed before this
	* shipped never got one. Neither means "the investigation found nothing", so a blank
	* `<pre>` would be the most misleading possible rendering.
	*
	* `log_path` is where that file lives on disk, because handing a colleague an artifact
	* usually means handing over a FILE and not a clipboard. It is empty whenever no file
	* exists, and the UI must never synthesize it: `KIROCREW_HOME` moves the data directory,
	* so a guessed path would be this app asserting a file the backend does not have.
	*/
	incident: (id) => req(`/incident?id=${encodeURIComponent(id)}`),
	/**
	* Move an incident to a new status.
	*
	* `slack_thread_replyable` says whether a reply typed into the incident's Slack thread
	* will actually reach the investigation. It is MUTATION-ONLY: the backend computes it
	* from `slack_out.link_thread_to_investigation` at transition time and no GET returns
	* it, so treat it as transient feedback and do not try to re-read it later.
	*
	* `Incident.slack_thread_ts` is NOT a substitute. Linking also requires Slack output to
	* be configured AND a live investigation slot to exist, so a non-empty ts with a missing
	* slot is exactly the false positive `test_slack_out.py` pins — it would promise the
	* operator their reply lands when it will not.
	*/
	transition: (id, status, extra) => req("/incident/transition", {
		method: "POST",
		body: JSON.stringify({
			id,
			status,
			...extra
		})
	}),
	/**
	* Hand-claim a signal off the Signals tab.
	*
	* Returns the same claim envelope `dispatch` does (http_routes/lifecycle.py `_handle_claim`
	* spreads `ClaimedIncident.to_dict()`), so `exact_match_ids` IS available here — and this
	* is the only read path that carries it, since the Board's payloads do not. See `dispatch`
	* for why it must not be re-derived from the incident.
	*/
	claim: (signal) => req("/incident/claim", {
		method: "POST",
		body: JSON.stringify({ signal })
	}),
	/**
	* Ask a provider sink to act on an incident, subject to the autonomy gate (a 403 here
	* is the gate explaining that no rule grants this action — surface its text).
	*
	* `duration_secs` applies to `silence` only, and the route CLAMPS it: unparseable,
	* missing or non-positive becomes a default window and anything over the ceiling is
	* reduced, because a suppression with no end is the one outcome that verb exists to
	* prevent. The echoed `duration_secs` is therefore the window ACTUALLY applied and may
	* be smaller than the one requested — read it back rather than displaying the request.
	* It is `null` for every non-expiring action.
	*
	* **`ok` means the provider returned 2xx and nothing more**, which is why the response
	* now also carries `verification`. Never present `ok: true` to an operator as "applied":
	* read `verification` and say which of the two happened —
	*
	* - `pending` with a `verify_after`: the request was accepted and the heartbeat will
	*   re-read the signal at that time. For a `silence` that time is the END of the
	*   window, because a suppression that expires straight back into the same firing
	*   condition is the strongest available evidence nothing was fixed.
	* - `not_checkable`: accepted, and this app cannot observe whether it took effect (an
	*   ack leaves an alert firing by design). Say "sent", not "confirmed".
	* - `''`: nothing was scheduled — either the call failed, or the bookkeeping write did.
	*   The provider write already happened and cannot be undone, so that degradation is
	*   deliberate rather than a 500.
	*/
	action: (id, action, opts) => req("/incident/action", {
		method: "POST",
		body: JSON.stringify({
			id,
			action,
			...opts
		})
	}),
	/**
	* The pending-proposal queue: what the agent has DRAFTED and is waiting on a person for.
	*
	* In `propose` mode this is the only surface that shows the STORED terms. Approving from
	* the agent's chat paraphrase approves whatever is in the store, which is precisely what
	* the digest binding exists to prevent — so the panel reads the proposal from here and
	* echoes the `digest` it displayed back on the decision.
	*/
	proposals: () => req("/proposals"),
	/**
	* Approve or reject a drafted action.
	*
	* `digest` is REQUIRED for an approval and must be the one rendered to the operator: the
	* route refuses a mismatch (409) rather than executing terms nobody read. A rejection
	* carries no digest because it authorizes nothing.
	*
	* A 403 is the autonomy gate, exactly as on `action()` — surface its text.
	*/
	decideProposal: (id, approve, digest) => req("/incident/proposal/decide", {
		method: "POST",
		body: JSON.stringify({
			id,
			approve,
			...digest ? { digest } : {}
		})
	}),
	/** Fresh each call: a cached handover goes stale between shifts. */
	handover: () => req("/handover"),
	/**
	* Current provider state.
	*
	* `firing` is state-filtered the way the dispatch loop filters; `signals` is the raw
	* list and includes anything a provider reported as recovered, so prefer `firing`
	* when showing "what is wrong right now".
	*
	* `poll_health` says, per source, whether the LAST poll actually succeeded. It is not
	* decoration: a signal missing from `firing` means either "it cleared" or "we could
	* not look", and only `poll_health` distinguishes them.
	*
	* `suppressed` is the third bucket and the third reason a signal is absent from
	* `firing`: a human parked it at the provider. Do NOT resolve on it — nothing was
	* fixed — and do not fold it into `cleared`, which asserts recovery. It is also why a
	* per-source "firing" count must be derived from `firing` and never from the raw
	* `signals` array: a parked signal counted as firing produces the exact contradiction
	* of "3 firing" above an empty queue, with no explanation.
	*
	* `all_sources_healthy` is `bool(health) and all(ok)`, so it is FALSE on a fresh install
	* with nothing configured — zero sources means an empty health map. A UI must branch on
	* three cases (nothing configured / healthy / a source is failing), never two, or it
	* tells a brand-new user that something is broken.
	*/
	signals: () => req("/signals"),
	providers: () => req("/providers"),
	/**
	* Run one dispatch cycle: poll, claim, match the ledger, release stale work.
	*
	* `matches` and `similar` are deliberately separate and must stay that way in any UI
	* that renders them. A `matches` entry means this exact failure fingerprint recurred;
	* a `similar` entry is a semantic near-miss whose fingerprint does NOT match. Showing
	* them together would let a near-miss inherit the "verified, used 4x" authority it has
	* not earned — the backend keeps them apart for the same reason (see
	* `dispatch.attach_similar_lessons`).
	*
	* `exact_match_ids` records which of THIS lookup's `matches` were decided by the
	* provider's own identity rather than by our shape hash — a distinction that matters
	* because the shape hash provably over-merges (with bare digits stripped, a 4xx and a 5xx
	* alarm on one resource hash identically), so a shape match can hand a responder a fix
	* learned from a different failure. It is a property of the lookup, not of the stored
	* entry, which is why the backend keeps it here and NOT on `Incident`.
	*
	* Consequently it is absent from `/state`, `/incidents` and `/incident` — the payloads the
	* Board reads — and must NOT be re-derived there. `dispatch.attach_ledger_matches`
	* captures it BEFORE `ledger.record_use` binds the provider key to the entry, so a
	* client-side `provider_key in entry.provider_keys` check would report "exact" for every
	* shape match from the second occurrence onward.
	*/
	dispatch: () => req("/dispatch", { method: "POST" }),
	/** Non-secret provider config. Secrets are refused here by the backend. */
	putProviderConfig: (providerId, updates) => req(`/providers/${encodeURIComponent(providerId)}/config`, {
		method: "PUT",
		body: JSON.stringify(updates)
	}),
	/**
	* App-level settings: autonomy mode, primary flag, cycle tuning.
	*
	* `notify_enabled` turns local desktop notifications on. There is nothing else to set
	* for that channel — no destination and no credential — which is the whole reason it
	* exists beside the Slack one. Per-channel muting is NOT here: Kiro Crew owns that
	* centrally at Settings → Notifications, and duplicating it would give an operator two
	* controls that can disagree.
	*
	* Also the ONLY way to point this instance at the team's shared-memory repo:
	* `ledger_sync_enabled`, `ledger_sync_remote` and `ledger_sync_branch`. The backend
	* length-caps the remote and refuses a branch that is not a plain ref.
	*
	* A remote URL is NOT a credential — auth is the operator's own SSH key, git credential
	* helper or `gh` login — which is why it may live in `config.json` at all. That file is
	* served UNAUTHENTICATED, so the flip side holds too: a URL with an embedded token would
	* be a secret written to a public file, and nothing on the write path strips one. The
	* panel must therefore never invite a token-bearing URL, and must not display one back.
	*/
	putSettings: (updates) => req("/settings", {
		method: "PUT",
		body: JSON.stringify(updates)
	}),
	putSecret: (providerId, field, value) => req(`/providers/${encodeURIComponent(providerId)}/secret`, {
		method: "PUT",
		body: JSON.stringify({
			field,
			value
		})
	}),
	deleteSecret: (providerId) => req(`/providers/${encodeURIComponent(providerId)}/secret`, { method: "DELETE" }),
	rotation: () => req("/rotation"),
	ledger: () => req("/ledger"),
	/**
	* The nightly maintenance pass: pull → hygiene → index → prune closed → push.
	*
	* AGENT-FACING. Its caller is the `ledger-hygiene` cron (via the SOP's curl), not a
	* button, and there is deliberately none here: the pass rewrites the shared ledger and
	* pushes to the team's repo, so it belongs to the one instance that owns it (see
	* `RotationRoster.leader`) rather than to whoever has Settings open. An operator-triggered
	* copy would be a second writer against the invariant that exactly one instance prunes.
	*
	* The full response is typed even though nothing reads it, because the previous
	* declaration listed 2 of its 5 keys — and an understated type is how a caller concludes
	* a stage does not report anything. `sync` carries the git outcome (empty strings when
	* sync is unconfigured, the common single-user case), `index` the vector-store counts, and
	* `incidents_pruned` the closed incidents retired. `changed` is wider than `summary`: it
	* is also true for a pull that brought in a teammate's lesson, which changes what the
	* agent knows tomorrow without changing any local count.
	*/
	ledgerHygiene: () => req("/ledger/hygiene", { method: "POST" }),
	/**
	* Entry pairs claiming DIFFERENT fixes for the same fingerprint.
	*
	* Also agent-facing — the hygiene SOP is told to resolve contradictions and this is how it
	* finds them deterministically instead of by eye. Declared rather than left off because
	* omission from this file is what makes a route invisible to the next reader; not rendered
	* because resolving a contradiction means splitting two patterns so each names its own
	* cause, which is a judgement, and a panel that only listed pairs would hand the operator
	* a problem with no control to fix it.
	*/
	ledgerContradictions: () => req("/ledger/contradictions"),
	addLedgerEntry: (entry) => req("/ledger", {
		method: "POST",
		body: JSON.stringify(entry)
	}),
	removeLedgerEntry: (id) => req(`/ledger?id=${encodeURIComponent(id)}`, { method: "DELETE" })
};
// src/SettingsPanel.tsx
/**
* Ops Mission Control — Settings.
*
* Without this panel the app cannot be set up at all: providers ship disabled and
* their credentials live in a keystone store the agent cannot reach, so a human
* with a browser is the only thing that can turn one on.
*
* Two invariants the UI must not break:
*
* - **Secrets are write-only.** The API never returns a stored token, so a field
*   that is already set shows a placeholder and an explicit Replace action rather
*   than a pre-filled value. Never round-trip a secret through this form.
* - **Autonomy is a ceiling.** The mode selector sets the app-level maximum; a
*   per-signal rule can only narrow it. The copy says so, because "act" reads as
*   a feature and is actually a grant of write access to production.
*
* i18n — DONE. Every string in this app's five components and `api.ts` routes through
* `i18nT` (~310 keys), and the keys are mirrored into all nine non-English catalogs so
* `catalogParity.test.ts` passes. An earlier revision of this comment argued at length
* that extraction was a core-i18n change belonging in its own PR; that turned out to be
* wrong, and the reason is worth keeping because it is the trap:
*
* `scripts/i18n-codemod.mjs --merge` is whole-corpus by design (no path scope), so a run
* also rewrites files this app does not own. The answer is not to defer — it is to revert
* the files outside this app after the run. Three were dragged in here (ComputerUseLiveView,
* ChatSidebar, TelemetryPanel) and reverted; their three leaked catalog keys had to be
* removed by hand too, because `deadKeys.test.ts` counts keys nothing references.
*
* What the nine catalogs carry for these keys is the **English fallback**, not a
* translation. That is deliberate and is the interim state `i18n-translate.mjs` exists to
* replace: parity checks key sets, placeholders and non-emptiness — not translation
* quality — and only `destructiveConfirm.test.ts`'s three SchedulePage keys must genuinely
* differ from English. A real translation pass for these 310 keys is still open.
*
* Do NOT hand-edit `en.json` to ADD keys — it is generated. The codemod refuses a
* non-`--merge` run once the corpus is converted, which is what stops a rebuild from
* silently wiping the catalog.
*/
/**
* Operator-facing message for a failed settings write.
*
* The error contract puts a machine `code` on every error body so callers can
* speak task vocabulary instead of the raw reason — which for the keystone's
* OSError-backed 503 is `str(exc)` ("[Errno 13] Permission denied") and for the
* validation 400s names the snake_case settings key. `subject` picks the
* sentence's subject (an identity field vs a settings change); both refusal
* strings name the settings store as the refuser, so a persistently failing
* retry has a diagnosis. Uncoded failures keep their backend reason verbatim.
*/
function settingsRefusalMessage(error, subject) {
	if (error instanceof OpsApiError) {
		if (error.code === "policy_store_unwritable") return subject === "identity" ? i18nT("apps.opsMissionControl.settingsPanel.identity_save_refused") : i18nT("apps.opsMissionControl.settingsPanel.change_save_refused");
		if (error.code === "value_too_long") return i18nT("apps.opsMissionControl.settingsPanel.value_too_long_refused");
	}
	return error.message;
}
/**
* Fenced rotation identities by provider id — the keystone-backed field a
* rotation-capable provider row renders. Keys only: the labels are resolved
* through `i18nT` at render so a locale switch re-translates them. Field name
* and settings key coincide by construction (`RotationIdentities` mirrors the
* keystone keys), so one name serves both.
*/
var FENCED_IDENTITY_FIELDS = {
	pagerduty: {
		labelKey: "apps.opsMissionControl.settingsPanel.your_pagerduty_user_id",
		helpKey: "apps.opsMissionControl.settingsPanel.pagerduty_user_id_help",
		settingsKey: "pagerduty_user_id"
	},
	incidentio: {
		labelKey: "apps.opsMissionControl.settingsPanel.your_incident_io_user_id",
		helpKey: "apps.opsMissionControl.settingsPanel.incidentio_user_id_help",
		settingsKey: "incidentio_user_id"
	}
};
function fencedIdentityFor(providerId, identities) {
	const field = FENCED_IDENTITY_FIELDS[providerId];
	if (!field) return void 0;
	return {
		label: i18nT(field.labelKey),
		settingsKey: field.settingsKey,
		value: identities?.[field.settingsKey] ?? "",
		help: i18nT(field.helpKey)
	};
}
/** Module-level frozen empty so the render-time fallback is referentially stable. */
var EMPTY_COMPANIONS = Object.freeze([]);
var MODE_HELP_KEY = {
	observe: "apps.opsMissionControl.settingsPanel.mode_help_observe",
	propose: "apps.opsMissionControl.settingsPanel.mode_help_propose",
	act: "apps.opsMissionControl.settingsPanel.mode_help_act"
};
function ProviderRow({ provider, fencedIdentity }) {
	const ime = useImeGuard();
	const queryClient = useQueryClient();
	const [secretDrafts, setSecretDrafts] = useState({});
	const [configDrafts, setConfigDrafts] = useState({});
	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "providers"] });
		queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
	};
	const configMutation = useMutation({
		mutationFn: (updates) => opsApi.putProviderConfig(provider.id, updates),
		onSuccess: invalidate
	});
	const secretMutation = useMutation({
		mutationFn: ({ field, value }) => opsApi.putSecret(provider.id, field, value),
		onSuccess: (_data, variables) => {
			setSecretDrafts((prev) => ({
				...prev,
				[variables.field]: ""
			}));
			invalidate();
		}
	});
	const revokeMutation = useMutation({
		mutationFn: () => opsApi.deleteSecret(provider.id),
		onSuccess: invalidate
	});
	const [identityDraft, setIdentityDraft] = useState(void 0);
	const identityMutation = useMutation({
		mutationFn: (value) => opsApi.putSettings({ [fencedIdentity.settingsKey]: value }),
		onSuccess: () => {
			setIdentityDraft(void 0);
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "rotation"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
		}
	});
	const commitIdentity = () => {
		if (identityDraft === void 0 || identityMutation.isPending) return;
		identityMutation.mutate(identityDraft.trim());
	};
	const enabled = Boolean(provider.config?.enabled);
	const editableFields = provider.config_fields.filter((f) => f !== "enabled");
	const hasEnableFlag = provider.config_fields.includes("enabled");
	const fieldsVisible = enabled || !hasEnableFlag;
	const indent = hasEnableFlag ? "ml-11" : "";
	return /* @__PURE__ */ jsxs("div", {
		className: "border-t border-border py-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 mb-1",
				children: [
					hasEnableFlag ? /* @__PURE__ */ jsx(Toggle, {
						checked: enabled,
						onChange: (v) => configMutation.mutate({ enabled: v }),
						label: i18nT("apps.opsMissionControl.settingsPanel.enable_provider", { provider: provider.display_name })
					}) : null,
					/* @__PURE__ */ jsx("span", {
						className: "text-sm font-medium",
						children: provider.display_name
					}),
					/* @__PURE__ */ jsx(Badge, {
						variant: provider.configured ? "ok" : "muted",
						children: provider.configured ? i18nT("apps.opsMissionControl.settingsPanel.ready") : i18nT("apps.opsMissionControl.settingsPanel.not_set_up")
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-[12px] text-muted ml-auto",
						children: provider.roles.join(" · ")
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-[12px] text-muted mb-2",
				children: provider.detail
			}),
			fencedIdentity ? /* @__PURE__ */ jsxs("div", {
				className: `flex flex-col gap-2 mb-2 ${hasEnableFlag ? "pl-11" : ""}`,
				children: [
					/* @__PURE__ */ jsxs("label", {
						className: "flex items-center gap-2 text-[13px]",
						htmlFor: `omc-${provider.id}-fenced-identity`,
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "w-44 shrink-0 text-muted",
								children: fencedIdentity.label
							}),
							/* @__PURE__ */ jsx(Input, {
								id: `omc-${provider.id}-fenced-identity`,
								value: identityDraft ?? fencedIdentity.value,
								placeholder: "—",
								onChange: (e) => setIdentityDraft(e.target.value),
								...ime.bindEnter({ onEnter: commitIdentity })
							}),
							/* @__PURE__ */ jsx(SendBtn, {
								disabled: identityDraft === void 0 || identityDraft === fencedIdentity.value || identityMutation.isPending,
								onClick: commitIdentity,
								children: i18nT("apps.opsMissionControl.settingsPanel.save")
							})
						]
					}),
					identityMutation.isError ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(ErrorNotice, { message: settingsRefusalMessage(identityMutation.error, "identity") }) }) : null,
					/* @__PURE__ */ jsx("p", {
						className: "text-[12px] text-muted",
						children: fencedIdentity.help
					})
				]
			}) : null,
			fieldsVisible && (editableFields.length > 0 || provider.secret_fields.length > 0) ? /* @__PURE__ */ jsxs("div", {
				className: `flex flex-col gap-2 ${hasEnableFlag ? "pl-11" : ""}`,
				children: [
					editableFields.map((field) => {
						const inputId = `omc-${provider.id}-${field}`;
						return /* @__PURE__ */ jsxs("label", {
							htmlFor: inputId,
							className: "flex items-center gap-2 text-[13px]",
							children: [/* @__PURE__ */ jsx("span", {
								className: "w-44 shrink-0 text-muted",
								children: field
							}), /* @__PURE__ */ jsx(Input, {
								id: inputId,
								value: configDrafts[field] ?? String(provider.config?.[field] ?? ""),
								onChange: (e) => setConfigDrafts((prev) => ({
									...prev,
									[field]: e.target.value
								})),
								onBlur: () => {
									const draft = configDrafts[field];
									if (draft !== void 0 && draft !== String(provider.config?.[field] ?? "")) configMutation.mutate({ [field]: draft });
								},
								placeholder: "—"
							})]
						}, field);
					}),
					provider.secret_fields.map((field) => {
						const isSet = Boolean(provider.secrets?.[field]);
						const secretId = `omc-${provider.id}-secret-${field}`;
						return /* @__PURE__ */ jsxs("label", {
							htmlFor: secretId,
							className: "flex items-center gap-2 text-[13px]",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "w-44 shrink-0 text-muted flex items-center gap-1",
									children: [
										/* @__PURE__ */ jsx(KeyRound, { className: "lucide-inline" }),
										" ",
										field
									]
								}),
								/* @__PURE__ */ jsx(Input, {
									id: secretId,
									type: "password",
									autoComplete: "off",
									value: secretDrafts[field] ?? "",
									onChange: (e) => setSecretDrafts((prev) => ({
										...prev,
										[field]: e.target.value
									})),
									placeholder: isSet ? i18nT("apps.opsMissionControl.settingsPanel.stored_enter_a_new_value_to_replace") : i18nT("apps.opsMissionControl.settingsPanel.not_set")
								}),
								/* @__PURE__ */ jsx(SendBtn, {
									disabled: !secretDrafts[field] || secretMutation.isPending,
									onClick: () => secretMutation.mutate({
										field,
										value: secretDrafts[field] ?? ""
									}),
									children: isSet ? i18nT("apps.opsMissionControl.settingsPanel.replace") : i18nT("apps.opsMissionControl.settingsPanel.save")
								})
							]
						}, field);
					}),
					provider.secret_fields.length > 0 && Object.keys(provider.secrets ?? {}).some((k) => provider.secrets?.[k]) ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Btn, {
						danger: true,
						disabled: revokeMutation.isPending,
						onClick: () => revokeMutation.mutate(),
						children: [
							/* @__PURE__ */ jsx(Trash2, { className: "lucide-inline" }),
							" ",
							i18nT("apps.opsMissionControl.settingsPanel.revoke_stored_credentials")
						]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-[12px] text-muted mt-1.5",
						children: i18nT("apps.opsMissionControl.settingsPanel.credential_retention_note")
					})] }) : null
				]
			}) : null,
			configMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
				className: indent,
				message: configMutation.error.message
			}) : null,
			secretMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
				className: indent,
				message: secretMutation.error.message
			}) : null,
			revokeMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
				className: indent,
				message: revokeMutation.error.message
			}) : null
		]
	});
}
/**
* Slack output channel — the pin board.
*
* Deliberately has NO token field. Kiro Crew already holds a Slack bot token for
* its own gateway and this app reuses that client, so there is no second
* credential to enter, store, or rotate. The consequence is a real dependency
* rather than a hidden one: when Kiro Crew's Slack is not connected, this card says
* so and points at the fix instead of silently doing nothing.
*/
function SlackOutCard({ status, onSave, saving }) {
	const [channel, setChannel] = useState(status?.channel ?? "");
	const [touched, setTouched] = useState(false);
	const serverChannel = status?.channel ?? "";
	useEffect(() => {
		if (!touched) setChannel(serverChannel);
	}, [serverChannel, touched]);
	const enabled = Boolean(status?.enabled);
	const dirty = touched && channel.trim() !== serverChannel;
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(MessageSquare, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.settingsPanel.slack")
		] }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.mirror_incidents_to_a_channel_as_a_live_board_on")
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 text-[13px]",
			children: [
				/* @__PURE__ */ jsx(Toggle, {
					checked: enabled,
					onChange: (v) => onSave({ slack_enabled: v }),
					label: i18nT("apps.opsMissionControl.settingsPanel.mirror_incidents_to_slack")
				}),
				/* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.mirror_incidents_to_slack") }),
				status ? /* @__PURE__ */ jsx(Badge, {
					variant: status.ready ? "ok" : enabled ? "warn" : "muted",
					children: status.ready ? i18nT("apps.opsMissionControl.settingsPanel.active") : enabled ? i18nT("apps.opsMissionControl.settingsPanel.needs_setup") : i18nT("apps.opsMissionControl.settingsPanel.off")
				}) : null
			]
		}),
		enabled ? /* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-col gap-2",
			children: [/* @__PURE__ */ jsxs("label", {
				className: "flex items-center gap-2 text-[13px]",
				htmlFor: "omc-slack-channel",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "w-44 shrink-0 text-muted",
						children: i18nT("apps.opsMissionControl.settingsPanel.channel_id")
					}),
					/* @__PURE__ */ jsx(Input, {
						id: "omc-slack-channel",
						value: channel,
						placeholder: i18nT("apps.opsMissionControl.settingsPanel.c0123456789"),
						onChange: (e) => {
							setTouched(true);
							setChannel(e.target.value);
						}
					}),
					/* @__PURE__ */ jsx(SendBtn, {
						disabled: !dirty || saving,
						onClick: () => {
							onSave({ slack_channel: channel.trim() });
							setTouched(false);
						},
						children: i18nT("apps.opsMissionControl.settingsPanel.save")
					})
				]
			}), /* @__PURE__ */ jsx("p", {
				className: "text-[12px] text-muted",
				children: i18nT("apps.opsMissionControl.settingsPanel.find_it_at_the_bottom_of_the_channel_s_detail_di")
			})]
		}) : null,
		status && !status.ready && enabled ? /* @__PURE__ */ jsxs("p", {
			className: "text-[13px] text-warn mt-3 flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: status.detail })]
		}) : null
	] });
}
/** Lucide component per channel icon name declared in `app.json`. */
var CHANNEL_ICONS = {
	UserCheck: /* @__PURE__ */ jsx(UserCheck, { className: "lucide-inline" }),
	Radio: /* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
	Clock: /* @__PURE__ */ jsx(Clock, { className: "lucide-inline" })
};
/**
* What each declared channel actually fires on.
*
* Keyed by the manifest id, so a channel the backend declares and this map does not know
* still renders (with its name and priority) rather than disappearing — an unexplained
* channel is better than a hidden one. Deliberately phrased as the EDGE condition,
* because that is the contract: the backend pushes on a state change and never on a tick,
* and copy that said "when a source is unhealthy" would read as a recurring alert.
*/
var CHANNEL_WHEN_KEY = {
	"waiting-on-you": "apps.opsMissionControl.settingsPanel.channel_when_waiting_on_you",
	"source-health": "apps.opsMissionControl.settingsPanel.channel_when_source_health",
	"incident-released": "apps.opsMissionControl.settingsPanel.channel_when_incident_released"
};
var isKnownChannel = (id) => id in CHANNEL_WHEN_KEY;
/**
* Local desktop notifications.
*
* This card exists because the app declared the `notification` permission from day one
* and never produced one, so the only push channel that needs NO credential and no
* inbound URL was inert — every fact this app computed required an open dashboard tab or
* a Slack workspace it holds no token for.
*
* Deliberately has NO per-channel mute control. Kiro Crew renders that centrally at
* Settings → Notifications (one row per channel with a mute switch and a priority
* override), and a second copy here would be two controls that can disagree about the
* same stored setting. What this card owns instead is the app-level on/off and the
* DECLARATION of which channels exist — which the central rail cannot show for a freshly
* installed app, because it lists channels only once they have been registered and
* registration happens on a channel's first push.
*/
function NotifyOutCard({ status, onSave }) {
	const enabled = Boolean(status?.enabled);
	const channels = status?.channels ?? [];
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(BellRing, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.settingsPanel.desktop_notifications")
		] }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.get_a_notification_when_something_changes_that_n")
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 text-[13px]",
			children: [
				/* @__PURE__ */ jsx(Toggle, {
					checked: enabled,
					onChange: (v) => onSave({ notify_enabled: v }),
					label: i18nT("apps.opsMissionControl.settingsPanel.notify_me_on_state_changes")
				}),
				/* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.notify_me_on_state_changes") }),
				status ? /* @__PURE__ */ jsx(Badge, {
					variant: status.ready ? "ok" : !enabled ? "muted" : status.bus_available ? "warn" : "err",
					title: status.detail,
					children: status.ready ? i18nT("apps.opsMissionControl.settingsPanel.active") : !enabled ? i18nT("apps.opsMissionControl.settingsPanel.off") : status.bus_available ? i18nT("apps.opsMissionControl.settingsPanel.needs_setup") : i18nT("apps.opsMissionControl.settingsPanel.unavailable_here")
				}) : null
			]
		}),
		channels.length > 0 ? /* @__PURE__ */ jsx("dl", {
			className: "mt-3 flex flex-col gap-2",
			children: channels.map((ch) => /* @__PURE__ */ jsxs("div", {
				className: "flex items-start gap-2 text-[13px]",
				children: [/* @__PURE__ */ jsxs("dt", {
					className: "flex items-center gap-1.5 w-44 shrink-0",
					children: [CHANNEL_ICONS[ch.icon] ?? /* @__PURE__ */ jsx(Bell, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: ch.name })]
				}), /* @__PURE__ */ jsxs("dd", {
					className: "text-muted",
					children: [isKnownChannel(ch.id) ? i18nT(CHANNEL_WHEN_KEY[ch.id]) : i18nT("apps.opsMissionControl.settingsPanel.when_a_state_changes"), ch.default_priority === "critical" ? /* @__PURE__ */ jsxs("span", {
						className: "text-warn",
						children: [" ", i18nT("apps.opsMissionControl.settingsPanel.interrupts_by_default")]
					}) : ch.default_priority === "passive" ? /* @__PURE__ */ jsxs("span", { children: [" ", i18nT("apps.opsMissionControl.settingsPanel.quiet_and_expires_on_its_own")] }) : null]
				})]
			}, ch.id))
		}) : null,
		/* @__PURE__ */ jsx("p", {
			className: "text-[12px] text-muted mt-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.one_notification_per_state_change_never_per_hear")
		}),
		enabled ? /* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted mt-1 flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(Info, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.to_silence_one_of_these_without_turning_the_rest") })]
		}) : null,
		status && !status.ready && enabled ? /* @__PURE__ */ jsxs("p", {
			className: "text-[13px] text-warn mt-3 flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: status.detail })]
		}) : null
	] });
}
/**
* Hide a `userinfo@` component before a remote URL is painted.
*
* `https://user:ghp_xxx@github.com/org/repo.git` → `https://github.com/org/repo.git`.
*
* Not theatre, and not a claim that the value was cleaned: `config.json` is served
* UNAUTHENTICATED (see `providers.write_config`), the write path only length-caps the
* remote, and `secrets.redact_tokens` has no pattern for a PAT embedded in a URL. So if an
* operator pastes a token-bearing remote it IS stored in a world-readable file, and this
* function changes nothing about that. What it does is stop this panel from being a second
* place the token is displayed — a screenshot or a screen-share of Settings should not leak
* a credential the operator has already been told not to enter here.
*/
function displayRemote(url) {
	const trimmed = url.trim();
	const marker = trimmed.indexOf("://");
	if (marker < 0) return trimmed;
	const rest = trimmed.slice(marker + 3);
	const at = rest.indexOf("@");
	const slash = rest.indexOf("/");
	if (at < 0 || slash >= 0 && at > slash) return trimmed;
	return `${trimmed.slice(0, marker + 3)}${rest.slice(at + 1)}`;
}
/**
* Shared team memory — the git repo the knowledge ledger syncs through.
*
* The backend has accepted these three settings all along and nothing ever sent them, so
* the app's headline team feature was reachable only by hand-editing `data/config.json`.
* The owner's report was exactly that: "I do not see where we can specify memory exchange
* / SOP / on-call schedule repository."
*
* Placed with the Slack card because both answer "where does this instance talk to the
* outside world", and BEFORE the Instance card because that card's nightly-maintenance
* copy only makes sense to someone who already knows a shared ledger exists.
*/
function SharedMemoryCard({ status, onSave, saving }) {
	const ime = useImeGuard();
	const serverRemote = status?.remote ?? "";
	const serverBranch = status?.branch ?? "";
	const [remote, setRemote] = useState(serverRemote);
	const [branch, setBranch] = useState(serverBranch);
	const [remoteTouched, setRemoteTouched] = useState(false);
	const [branchTouched, setBranchTouched] = useState(false);
	useEffect(() => {
		if (!remoteTouched) setRemote(serverRemote);
	}, [serverRemote, remoteTouched]);
	useEffect(() => {
		if (!branchTouched) setBranch(serverBranch);
	}, [serverBranch, branchTouched]);
	const enabled = Boolean(status?.enabled);
	const remoteDirty = remoteTouched && remote.trim() !== serverRemote;
	const branchDirty = branchTouched && branch.trim() !== "" && branch.trim() !== serverBranch;
	const saveRemote = () => {
		if (!remoteDirty || saving) return;
		onSave({ ledger_sync_remote: remote.trim() });
		setRemoteTouched(false);
	};
	const saveBranch = () => {
		if (!branchDirty || saving) return;
		onSave({ ledger_sync_branch: branch.trim() });
		setBranchTouched(false);
	};
	const branchDrifted = Boolean(status?.ready && status.initialized && !status.branch_matches);
	const badge = status?.schedule_conflict ? {
		variant: "err",
		label: i18nT("apps.opsMissionControl.settingsPanel.schedule_conflict")
	} : status?.conflict ? {
		variant: "warn",
		label: i18nT("apps.opsMissionControl.settingsPanel.ledger_conflict")
	} : branchDrifted ? {
		variant: "warn",
		label: status?.detached ? i18nT("apps.opsMissionControl.settingsPanel.detached_head") : i18nT("apps.opsMissionControl.settingsPanel.wrong_local_branch")
	} : status?.ready && status.initialized ? {
		variant: "ok",
		label: i18nT("apps.opsMissionControl.settingsPanel.syncing")
	} : status?.ready ? {
		variant: "ok",
		label: i18nT("apps.opsMissionControl.settingsPanel.ready")
	} : enabled ? {
		variant: "warn",
		label: i18nT("apps.opsMissionControl.settingsPanel.needs_setup")
	} : {
		variant: "muted",
		label: i18nT("apps.opsMissionControl.settingsPanel.off")
	};
	const troubled = Boolean(status && (!status.ready || status.conflict || status.schedule_conflict || branchDrifted));
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(FolderGit2, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.settingsPanel.shared_team_memory")
		] }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.ledger_intro", { file: "ledger.jsonl" })
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted mb-3 flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(Info, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
				i18nT("apps.opsMissionControl.settingsPanel.exchange_happens_on_the_nightly_maintenance_pass"),
				" ",
				/* @__PURE__ */ jsx("span", {
					className: "font-mono",
					children: i18nT("apps.opsMissionControl.settingsPanel.rotation_yaml")
				}),
				" ",
				i18nT("apps.opsMissionControl.settingsPanel.it_last_saw")
			] })]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 text-[13px]",
			children: [
				/* @__PURE__ */ jsx(Toggle, {
					checked: enabled,
					onChange: (v) => onSave({ ledger_sync_enabled: v }),
					label: i18nT("apps.opsMissionControl.settingsPanel.share_the_knowledge_ledger_with_my_team")
				}),
				/* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.share_the_knowledge_ledger_with_my_team") }),
				status ? /* @__PURE__ */ jsx(Badge, {
					variant: badge.variant,
					children: badge.label
				}) : null
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-center gap-2 text-[13px]",
					htmlFor: "omc-sync-remote",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-44 shrink-0 text-muted",
							children: i18nT("apps.opsMissionControl.settingsPanel.repository")
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "omc-sync-remote",
							value: remote,
							placeholder: i18nT("apps.opsMissionControl.settingsPanel.git_github_com_your_org_ops_memory_git"),
							onChange: (e) => {
								setRemoteTouched(true);
								setRemote(e.target.value);
							},
							...ime.bindEnter({ onEnter: saveRemote })
						}),
						/* @__PURE__ */ jsx(SendBtn, {
							disabled: !remoteDirty || saving,
							onClick: saveRemote,
							children: i18nT("apps.opsMissionControl.settingsPanel.save")
						})
					]
				}),
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-center gap-2 text-[13px]",
					htmlFor: "omc-sync-branch",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "w-44 shrink-0 text-muted flex items-center gap-1",
							children: [
								/* @__PURE__ */ jsx(GitBranch, { className: "lucide-inline" }),
								" ",
								i18nT("apps.opsMissionControl.settingsPanel.branch")
							]
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "omc-sync-branch",
							value: branch,
							placeholder: i18nT("apps.opsMissionControl.settingsPanel.main"),
							onChange: (e) => {
								setBranchTouched(true);
								setBranch(e.target.value);
							},
							...ime.bindEnter({ onEnter: saveBranch })
						}),
						/* @__PURE__ */ jsx(SendBtn, {
							disabled: !branchDirty || saving,
							onClick: saveBranch,
							children: i18nT("apps.opsMissionControl.settingsPanel.save")
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[12px] text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.no_credential_note", {
						gitCmd: "git",
						sshRemote: "git@github.com:org/repo.git",
						defaultBranch: "main"
					})
				})
			]
		}),
		status ? /* @__PURE__ */ jsxs("dl", {
			className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] mt-3",
			children: [
				/* @__PURE__ */ jsx("dt", {
					className: "text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.remote")
				}),
				/* @__PURE__ */ jsx("dd", {
					className: "font-mono truncate",
					children: displayRemote(status.remote) || "—"
				}),
				/* @__PURE__ */ jsx("dt", {
					className: "text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.branch")
				}),
				/* @__PURE__ */ jsx("dd", {
					className: "font-mono",
					children: status.branch || "main"
				}),
				branchDrifted ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("dt", {
					className: "text-warn",
					children: i18nT("apps.opsMissionControl.settingsPanel.this_repo_is_on")
				}), /* @__PURE__ */ jsx("dd", {
					className: "font-mono text-warn",
					children: status.detached ? i18nT("apps.opsMissionControl.settingsPanel.no_branch_detached_head") : status.local_branch || "—"
				})] }) : null
			]
		}) : null,
		troubled && status ? /* @__PURE__ */ jsxs("p", {
			className: `text-[13px] mt-3 flex items-start gap-1.5 ${status.schedule_conflict ? "text-danger" : "text-warn"}`,
			children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: status.detail })]
		}) : null,
		status?.schedule_conflict ? /* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted mt-1",
			children: [
				i18nT("apps.opsMissionControl.settingsPanel.pushes_stay_refused_until"),
				" ",
				/* @__PURE__ */ jsx("span", {
					className: "font-mono",
					children: i18nT("apps.opsMissionControl.settingsPanel.rotation_yaml")
				}),
				" ",
				i18nT("apps.opsMissionControl.settingsPanel.is_resolved_by_hand_in_the_repo_publishing_a_sch")
			]
		}) : null,
		branchDrifted && status ? /* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted mt-1",
			children: [
				i18nT("apps.opsMissionControl.settingsPanel.your_team_s_ledger_is_still_being_exchanged_sync"),
				" ",
				/* @__PURE__ */ jsx("span", {
					className: "font-mono",
					children: status.branch || "main"
				}),
				" ",
				i18nT("apps.opsMissionControl.settingsPanel.explicitly_every_time_what_does_not_work_is"),
				" ",
				/* @__PURE__ */ jsx("span", {
					className: "font-mono",
					children: i18nT("apps.opsMissionControl.settingsPanel.git_pull_or_push")
				}),
				" ",
				i18nT("apps.opsMissionControl.settingsPanel.run_by_hand_in_the_ledger_directory_because_this"),
				" ",
				status.detached ? i18nT("apps.opsMissionControl.settingsPanel.detached_head_left_alone_finish_the_merge_first") : i18nT("apps.opsMissionControl.settingsPanel.next_sync_moves_it_across_unless_a_branch_exists")
			]
		}) : null
	] });
}
/**
* On-call schedule — the second file in that same repo.
*
* Exists because the format was documented ONLY in a Python docstring, the module spec and
* one SOP, so an operator standing in Settings had no way to learn that the schedule is a
* file at all, let alone which file. It is deliberately not a path they choose: every
* teammate must read the same one, so `schedule_file.schedule_path()` fixes it beside
* `ledger.jsonl`.
*
* Renders `github_login` here rather than only in the generic Providers row above because
* this is where someone goes looking for it, and it answers the roster warnings directly
* beneath. Both controls post the same key through the same mutation, so they cannot
* disagree on the server.
*/
function OnCallScheduleCard({ provider, roster, syncReady }) {
	const ime = useImeGuard();
	const queryClient = useQueryClient();
	const serverLogin = String(roster?.me ?? "");
	const [login, setLogin] = useState(serverLogin);
	const [touched, setTouched] = useState(false);
	useEffect(() => {
		if (!touched) setLogin(serverLogin);
	}, [serverLogin, touched]);
	const loginMutation = useMutation({
		mutationFn: (value) => opsApi.putSettings({ schedule_github_login: value }),
		onSuccess: () => {
			setTouched(false);
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "providers"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "rotation"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
		}
	});
	const strictMutation = useMutation({
		mutationFn: (value) => opsApi.putSettings({ schedule_strict_gating: value }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "rotation"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
		}
	});
	const dirty = touched && login.trim() !== serverLogin;
	const commit = () => {
		if (!dirty || loginMutation.isPending) return;
		loginMutation.mutate(login.trim());
	};
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(CalendarClock, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.settingsPanel.on_call_schedule")
		] }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.schedule_location_note", {
				schedule: "rotation.yaml",
				ledger: "ledger.jsonl"
			})
		}),
		!syncReady ? /* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-warn mb-3 flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.sharing_is_not_set_up_above_so_the_schedule_is_w") })]
		}) : null,
		/* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(Info, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.expected_shape_label") })]
		}),
		/* @__PURE__ */ jsx("pre", {
			className: "font-mono text-[12px] bg-bg-elevated border border-border rounded-md p-2.5 mt-1 overflow-x-auto",
			children: `leader: octocat                 # optional; runs nightly ledger hygiene alone
timezone: America/Los_Angeles   # optional; UTC when absent
shifts:
  - from: 2026-08-01
    to: 2026-08-08              # a date-only 'to' means THROUGH that whole day
    who: octocat                # a GitHub login
  - from: 2026-08-08T09:00
    to: 2026-08-15T09:00
    who: [octocat, hubot]       # a list is allowed — co-primary`
		}),
		!provider ? /* @__PURE__ */ jsx("p", {
			className: "text-[12px] text-muted mt-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.loading")
		}) : null,
		provider ? /* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-center gap-2 text-[13px]",
					htmlFor: "omc-schedule-login",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-44 shrink-0 text-muted",
							children: i18nT("apps.opsMissionControl.settingsPanel.your_github_login")
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "omc-schedule-login",
							value: login,
							placeholder: i18nT("apps.opsMissionControl.settingsPanel.resolved_from_the_gh_cli_when_blank"),
							onChange: (e) => {
								setTouched(true);
								setLogin(e.target.value);
							},
							...ime.bindEnter({ onEnter: commit })
						}),
						/* @__PURE__ */ jsx(SendBtn, {
							disabled: !dirty || loginMutation.isPending,
							onClick: commit,
							children: i18nT("apps.opsMissionControl.settingsPanel.save")
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[12px] text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.github_login_help", {
						whoKey: "who:",
						ghCli: "gh"
					})
				}),
				loginMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, { message: settingsRefusalMessage(loginMutation.error, "identity") }) : null
			]
		}) : null,
		roster ? /* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-col gap-1.5",
			children: [
				!roster.me ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						i18nT("apps.opsMissionControl.settingsPanel.no_github_login_resolved_for_this_instance_so_it"),
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: i18nT("apps.opsMissionControl.settingsPanel.gh")
						}),
						" ",
						i18nT("apps.opsMissionControl.settingsPanel.cli")
					] })]
				}) : null,
				roster.me && !roster.me_on_roster && roster.strict_gating ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: roster.me
						}),
						" ",
						i18nT("apps.opsMissionControl.settingsPanel.is_not_named_in_any_shift_so_under_strict_gating"),
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: i18nT("apps.opsMissionControl.settingsPanel.who")
						}),
						" ",
						i18nT("apps.opsMissionControl.settingsPanel.list_or_correct_the_login_above")
					] })]
				}) : null,
				roster.me && !roster.me_on_roster && !roster.strict_gating ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-muted flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(Info, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: roster.me
						}),
						" ",
						i18nT("apps.opsMissionControl.settingsPanel.is_not_named_in_any_shift_and_strict_gating_is_o"),
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "font-mono",
							children: i18nT("apps.opsMissionControl.settingsPanel.who")
						}),
						" ",
						i18nT("apps.opsMissionControl.settingsPanel.list_if_the_rotation_is_meant_to_decide_who_resp")
					] })]
				}) : null,
				roster.error ? /* @__PURE__ */ jsx(ErrorNotice, { message: roster.error }) : null,
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[13px] pt-1",
					children: [/* @__PURE__ */ jsx(Toggle, {
						checked: roster.strict_gating,
						onChange: (v) => strictMutation.mutate(v),
						label: i18nT("apps.opsMissionControl.settingsPanel.only_the_on_call_instance_picks_up_work")
					}), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.only_the_on_call_instance_picks_up_work") })]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-[12px] text-muted flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(Info, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: roster.strict_gating ? i18nT("apps.opsMissionControl.settingsPanel.strict_on_explanation") : i18nT("apps.opsMissionControl.settingsPanel.strict_off_explanation") })]
				})
			]
		}) : null
	] });
}
/**
* Seconds as something an operator reads at 3am without doing arithmetic.
*
* Exported for the unit test: the whole point of this card is that the stored unit
* (seconds) is not the unit a human reasons about, and 43200 silently misread as minutes
* is exactly the confusion the card exists to remove.
*/
function humanizeSecs(secs) {
	if (!Number.isFinite(secs) || secs <= 0) return "—";
	if (secs < 60) return fmtUnit(secs, "second");
	if (secs < 3600) return fmtUnit(secs / 60, "minute", { maximumFractionDigits: 1 });
	return fmtUnit(secs / 3600, "hour", { maximumFractionDigits: 1 });
}
/**
* Heartbeat pacing — the claim ceiling and the two release windows.
*
* `PUT /settings` has accepted all three for as long as they existed and no read path
* returned any of them, so an operator who changed how long a dead investigation pins a
* signal got no confirmation and no way to look the value up again. Worse for the
* untouched case: the defaults governing every install were invisible, so "how long
* before this gets picked up again" had no answer short of reading the source.
*
* Last in the panel deliberately. These are tuning knobs with correct defaults — an
* operator setting the app up needs providers and autonomy, not this — and putting them
* above the setup cards would imply they need attention.
*/
function HeartbeatCard({ sweep, onSave, saving }) {
	const ime = useImeGuard();
	const serverStale = sweep?.stale_after_secs ?? 0;
	const serverNeedsHuman = sweep?.needs_human_stale_after_secs ?? 0;
	const [stale, setStale] = useState("");
	const [needsHuman, setNeedsHuman] = useState("");
	const [staleTouched, setStaleTouched] = useState(false);
	const [needsHumanTouched, setNeedsHumanTouched] = useState(false);
	useEffect(() => {
		if (!staleTouched) setStale(serverStale ? String(Math.round(serverStale / 60)) : "");
	}, [serverStale, staleTouched]);
	useEffect(() => {
		if (!needsHumanTouched) setNeedsHuman(serverNeedsHuman ? String(Math.round(serverNeedsHuman / 60)) : "");
	}, [serverNeedsHuman, needsHumanTouched]);
	const parseMins = (raw) => {
		const mins = Number(raw.trim());
		if (!raw.trim() || !Number.isInteger(mins) || mins <= 0) return null;
		return mins * 60;
	};
	const staleSecs = parseMins(stale);
	const needsHumanSecs = parseMins(needsHuman);
	const staleDirty = staleTouched && staleSecs !== null && staleSecs !== serverStale;
	const needsHumanDirty = needsHumanTouched && needsHumanSecs !== null && needsHumanSecs !== serverNeedsHuman;
	const save = (key, secs, clear) => {
		if (secs === null || saving) return;
		onSave({ [key]: secs });
		clear();
	};
	if (!sweep) return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardTitle, { children: [
		/* @__PURE__ */ jsx(Clock, { className: "lucide-inline" }),
		" ",
		i18nT("apps.opsMissionControl.settingsPanel.heartbeat_pacing")
	] }), /* @__PURE__ */ jsx("p", {
		className: "text-[13px] text-muted",
		children: i18nT("apps.opsMissionControl.settingsPanel.not_reported_by_this_gateway_so_the_values_in_fo")
	})] });
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(Clock, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.settingsPanel.heartbeat_pacing")
		] }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.how_much_the_heartbeat_picks_up_at_once_and_how")
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-2",
			children: [/* @__PURE__ */ jsxs("label", {
				className: "flex items-center gap-2 text-[13px]",
				htmlFor: "omc-stale-after",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "w-56 shrink-0 text-muted",
						children: i18nT("apps.opsMissionControl.settingsPanel.release_an_investigation_after")
					}),
					/* @__PURE__ */ jsx(Input, {
						id: "omc-stale-after",
						value: stale,
						inputMode: "numeric",
						placeholder: "120",
						onChange: (e) => {
							setStaleTouched(true);
							setStale(e.target.value);
						},
						...ime.bindEnter({ onEnter: () => save("stale_after_secs", staleSecs, () => setStaleTouched(false)) })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted shrink-0",
						children: i18nT("apps.opsMissionControl.settingsPanel.min")
					}),
					/* @__PURE__ */ jsx(SendBtn, {
						disabled: !staleDirty || saving,
						onClick: () => save("stale_after_secs", staleSecs, () => setStaleTouched(false)),
						children: i18nT("apps.opsMissionControl.settingsPanel.save")
					})
				]
			}), /* @__PURE__ */ jsxs("label", {
				className: "flex items-center gap-2 text-[13px]",
				htmlFor: "omc-needs-human-after",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "w-56 shrink-0 text-muted",
						children: i18nT("apps.opsMissionControl.settingsPanel.release_a_question_after")
					}),
					/* @__PURE__ */ jsx(Input, {
						id: "omc-needs-human-after",
						value: needsHuman,
						inputMode: "numeric",
						placeholder: "720",
						onChange: (e) => {
							setNeedsHumanTouched(true);
							setNeedsHuman(e.target.value);
						},
						...ime.bindEnter({ onEnter: () => save("needs_human_stale_after_secs", needsHumanSecs, () => setNeedsHumanTouched(false)) })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted shrink-0",
						children: i18nT("apps.opsMissionControl.settingsPanel.min")
					}),
					/* @__PURE__ */ jsx(SendBtn, {
						disabled: !needsHumanDirty || saving,
						onClick: () => save("needs_human_stale_after_secs", needsHumanSecs, () => setNeedsHumanTouched(false)),
						children: i18nT("apps.opsMissionControl.settingsPanel.save")
					})
				]
			})]
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "text-[12px] text-muted mt-2",
			children: [
				i18nT("apps.opsMissionControl.settingsPanel.an_incident_waiting_on_you_gets_the_longer_windo"),
				" ",
				sweep.needs_human_derived ? /* @__PURE__ */ jsx(Fragment, { children: i18nT("apps.opsMissionControl.settingsPanel.needs_human_derived", { value: humanizeSecs(serverNeedsHuman) }) }) : /* @__PURE__ */ jsx(Fragment, { children: i18nT("apps.opsMissionControl.settingsPanel.needs_human_pinned", { value: humanizeSecs(serverNeedsHuman) }) })
			]
		}),
		/* @__PURE__ */ jsxs("dl", {
			className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] mt-3",
			children: [
				/* @__PURE__ */ jsx("dt", {
					className: "text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.in_force_now")
				}),
				/* @__PURE__ */ jsxs("dd", {
					className: "font-mono",
					children: [
						humanizeSecs(serverStale),
						" / ",
						humanizeSecs(serverNeedsHuman)
					]
				}),
				/* @__PURE__ */ jsx("dt", {
					className: "text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.new_claims_per_heartbeat")
				}),
				/* @__PURE__ */ jsx("dd", {
					className: "font-mono",
					children: sweep.max_claims_per_cycle
				})
			]
		})
	] });
}
/**
* Author the per-signal grants that `act` mode needs.
*
* This whole component is the fix for a dead end: mode could be set to `act`, the copy said
* grants came from "patterns you have explicitly allowlisted with a rule", and there was
* NOWHERE to write one — `policy_store.set_rules` had no caller and `/rotation` returned only
* a count. So `act` was unreachable, and an operator following the manual (which said to edit
* `data/config.json`) got silent Propose behavior instead, because the keystone store ignores
* that file once the policy file exists.
*
* A rule needs a resource glob or a label match; the backend refuses a blanket act-grant with
* a 400 and this form requires the glob for the same reason, so the refusal is visible before
* a round trip rather than as a server error.
*/
function ActRulesCard({ rules, sources, onSave, saving, error }) {
	const [source, setSource] = useState("");
	const [glob, setGlob] = useState("");
	const eligible = sources.filter((p) => p.configured && p.roles.includes("signal"));
	const canAdd = source !== "" && glob.trim() !== "" && !saving;
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.settingsPanel.act_rules") }),
		/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted mb-3",
			children: i18nT("apps.opsMissionControl.settingsPanel.act_needs_both_the_mode_above_and_a_rule_that_ma")
		}),
		rules.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-muted",
			children: i18nT("apps.opsMissionControl.settingsPanel.no_rules_yet_add_one_below_to_grant_authority_fo")
		}) : /* @__PURE__ */ jsx("ul", {
			className: "flex flex-col gap-1.5 mb-3",
			children: rules.map((rule, index) => /* @__PURE__ */ jsxs("li", {
				className: "flex items-center gap-2 text-[13px]",
				children: [
					/* @__PURE__ */ jsx(Badge, {
						variant: "warn",
						children: rule.mode
					}),
					/* @__PURE__ */ jsx("span", {
						className: "font-mono",
						children: rule.source
					}),
					/* @__PURE__ */ jsx("span", {
						className: "font-mono text-muted",
						children: rule.resource_glob ?? ""
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-[12px] text-muted",
						children: rule.actions && rule.actions.length > 0 ? rule.actions.join(", ") : i18nT("apps.opsMissionControl.settingsPanel.all_actions")
					}),
					/* @__PURE__ */ jsx(Btn, {
						disabled: saving,
						onClick: () => onSave(rules.filter((_, i) => i !== index)),
						"aria-label": i18nT("apps.opsMissionControl.settingsPanel.revoke_rule"),
						children: /* @__PURE__ */ jsx(Trash2, { className: "lucide-inline" })
					})
				]
			}, `${rule.source}-${rule.resource_glob ?? ""}-${index}`))
		}),
		eligible.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "text-[12px] text-muted mt-2",
			children: i18nT("apps.opsMissionControl.settingsPanel.connect_a_signal_source_first_a_rule_naming_an_u")
		}) : /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-2 mt-3",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[13px]",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-44 shrink-0 text-muted",
						children: i18nT("apps.opsMissionControl.settingsPanel.signal_source")
					}), /* @__PURE__ */ jsx(Select, {
						options: eligible.map((p) => p.id),
						optionLabels: eligible.map((p) => p.display_name),
						value: source,
						onChange: setSource,
						clearLabel: i18nT("apps.opsMissionControl.settingsPanel.choose_a_source"),
						"aria-label": i18nT("apps.opsMissionControl.settingsPanel.signal_source")
					})]
				}),
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-center gap-2 text-[13px]",
					htmlFor: "omc-rule-glob",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-44 shrink-0 text-muted",
							children: i18nT("apps.opsMissionControl.settingsPanel.resource_pattern")
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "omc-rule-glob",
							value: glob,
							placeholder: i18nT("apps.opsMissionControl.settingsPanel.prod_star"),
							onChange: (e) => setGlob(e.target.value)
						}),
						/* @__PURE__ */ jsx(SendBtn, {
							disabled: !canAdd,
							onClick: () => {
								onSave([...rules, {
									source,
									mode: "act",
									resource_glob: glob.trim()
								}]);
								setSource("");
								setGlob("");
							},
							children: i18nT("apps.opsMissionControl.settingsPanel.grant")
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[12px] text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.a_pattern_is_required_there_is_no_wildcard_grant")
				})
			]
		}),
		/* @__PURE__ */ jsx(ErrorNotice, {
			className: "mt-2",
			message: error
		})
	] });
}
function SettingsPanel() {
	const queryClient = useQueryClient();
	const providersQuery = useQuery({
		queryKey: ["ops-mission-control", "providers"],
		queryFn: () => opsApi.providers()
	});
	const rotationQuery = useQuery({
		queryKey: ["ops-mission-control", "rotation"],
		queryFn: () => opsApi.rotation(),
		staleTime: 3e4
	});
	const stateQuery = useQuery({
		queryKey: ["ops-mission-control", "state"],
		queryFn: () => opsApi.state()
	});
	const settingsMutation = useMutation({
		mutationFn: (updates) => opsApi.putSettings(updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "rotation"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
		}
	});
	const providers = providersQuery.data?.providers ?? [];
	const companions = stateQuery.data?.companions ?? EMPTY_COMPANIONS;
	const mode = rotationQuery.data?.mode ?? "observe";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.settingsPanel.autonomy") }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-3",
					children: i18nT("apps.opsMissionControl.settingsPanel.the_maximum_this_instance_may_do_a_per_signal_ru")
				}),
				/* @__PURE__ */ jsx(SegmentedControl, {
					segments: [
						{
							key: "observe",
							label: i18nT("apps.opsMissionControl.settingsPanel.mode_observe_label"),
							icon: /* @__PURE__ */ jsx(Eye, { className: "lucide-inline" })
						},
						{
							key: "propose",
							label: i18nT("apps.opsMissionControl.settingsPanel.mode_propose_label"),
							icon: /* @__PURE__ */ jsx(MessageSquare, { className: "lucide-inline" })
						},
						{
							key: "act",
							label: i18nT("apps.opsMissionControl.settingsPanel.mode_act_label"),
							icon: /* @__PURE__ */ jsx(Zap, { className: "lucide-inline" })
						}
					],
					value: mode,
					onChange: (value) => settingsMutation.mutate({ mode: value }),
					layoutId: "omc-mode",
					collapse: false
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mt-3",
					children: i18nT(MODE_HELP_KEY[mode])
				}),
				mode === "act" ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn mt-2 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(ShieldAlert, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.act_only_takes_effect_for_signals_matched_by_a_r") })]
				}) : null,
				settingsMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
					className: "mt-2",
					message: settingsRefusalMessage(settingsMutation.error, "change")
				}) : null
			] }),
			rotationQuery.data?.rules_detail !== void 0 ? /* @__PURE__ */ jsx(ActRulesCard, {
				rules: rotationQuery.data.rules_detail,
				sources: providers,
				onSave: (next) => settingsMutation.mutate({ autonomy_rules: next }),
				saving: settingsMutation.isPending,
				error: settingsMutation.isError ? settingsMutation.error.message : ""
			}) : null,
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.settingsPanel.providers") }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted",
					children: i18nT("apps.opsMissionControl.settingsPanel.turn_on_the_systems_you_want_watched_aws_uses_yo")
				}),
				providersQuery.isLoading ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted mt-2",
					children: i18nT("apps.opsMissionControl.settingsPanel.loading")
				}) : providers.map((p) => /* @__PURE__ */ jsx(ProviderRow, {
					provider: p,
					fencedIdentity: fencedIdentityFor(p.id, rotationQuery.data?.identities)
				}, p.id)),
				companions.length > 0 ? /* @__PURE__ */ jsx("div", {
					className: "border-t border-border pt-3 mt-3",
					children: /* @__PURE__ */ jsx("p", {
						className: "text-[12px] text-muted",
						children: i18nT("apps.opsMissionControl.settingsPanel.companions_installed", {
							count: companions.length,
							names: companions.map((c) => c.name).join(", ")
						})
					})
				}) : null
			] }),
			/* @__PURE__ */ jsx(SlackOutCard, {
				status: stateQuery.data?.slack,
				onSave: (updates) => settingsMutation.mutate(updates),
				saving: settingsMutation.isPending
			}),
			/* @__PURE__ */ jsx(NotifyOutCard, {
				status: stateQuery.data?.notify,
				onSave: (updates) => settingsMutation.mutate(updates)
			}),
			/* @__PURE__ */ jsx(SharedMemoryCard, {
				status: stateQuery.data?.ledger_sync,
				onSave: (updates) => settingsMutation.mutate(updates),
				saving: settingsMutation.isPending
			}),
			/* @__PURE__ */ jsx(OnCallScheduleCard, {
				provider: providers.find((p) => p.id === "schedule-file"),
				roster: rotationQuery.data?.roster,
				syncReady: Boolean(stateQuery.data?.ledger_sync?.ready)
			}),
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.settingsPanel.instance") }),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[13px]",
					children: [/* @__PURE__ */ jsx(Toggle, {
						checked: Boolean(rotationQuery.data?.primary),
						onChange: (v) => settingsMutation.mutate({ primary_instance: v }),
						label: i18nT("apps.opsMissionControl.settingsPanel.run_nightly_ledger_maintenance_on_this_instance")
					}), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.settingsPanel.run_nightly_ledger_maintenance_on_this_instance") })]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[12px] text-muted mt-2",
					children: i18nT("apps.opsMissionControl.settingsPanel.leave_this_on_if_you_are_the_only_one_running_op")
				})
			] }),
			/* @__PURE__ */ jsx(HeartbeatCard, {
				sweep: rotationQuery.data?.sweep,
				onSave: (updates) => settingsMutation.mutate(updates),
				saving: settingsMutation.isPending
			})
		]
	});
}
// src/safeUrl.ts
/**
* Validate that a URL is a safe HTTP(S) link — reject javascript:, data:, etc.
* Returns the original URL if valid, null otherwise.
*
* Also reject URLs carrying HTTP Basic-auth userinfo (https://user:pass@host): an
* LLM-controlled URL could otherwise smuggle credentials that get transmitted to the
* host when the link is opened. The dashboard's own `lib/safeUrl.safeHttpUrl`, copied.
*/
function safeHttpUrl(url) {
	try {
		const u = new URL(url);
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		if (u.username || u.password) return null;
		return url;
	} catch {
		return null;
	}
}
// src/SignalsPanel.tsx
/**
* SignalsPanel — the Signals tab.
*
* The Signals rail used to be a 280px column beside the Board, which made it a
* status readout and nothing more: no room to show what a source last returned, no
* way to see a signal the heartbeat has NOT claimed yet, and no way to act on one.
* Splitting it out gives signal configuration real space and hands the Board its
* full width back.
*
* What this surface answers that the rail could not:
*
* - Which sources are wired, and which are silently unconfigured.
* - What each source returned on the LAST poll, including its error text. A
*   provider whose credentials expired reports "ready" from config alone; only a
*   real poll shows the failure.
* - Whether a quiet board can be TRUSTED (`all_sources_healthy`). Absence of a signal
*   means "it cleared" only for a source whose poll succeeded.
* - Which firing signals are NOT yet incidents. Under the claim cap (3/cycle) an
*   alarm storm legitimately leaves a queue, and before this the remainder was a
*   number with no detail — you could see "12 remaining" but not what they were.
* - Claim one now, rather than waiting for the next heartbeat.
*/
/** Module-level frozen empty so the render-time fallback is referentially stable. */
var EMPTY_PROVIDERS$1 = Object.freeze([]);
function severityVariant$1(severity) {
	if (severity === "critical") return "err";
	if (severity === "warning") return "warn";
	return "muted";
}
/** Compact relative age, so a stale failure reads as stale. */
function age$1(iso) {
	if (!iso) return "";
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return "";
	const secs = Math.max(0, Math.floor((Date.now() - then) / 1e3));
	if (secs < 60) return i18nT("apps.opsMissionControl.signalsPanel.n_s_ago", { n: secs });
	if (secs < 3600) return i18nT("apps.opsMissionControl.signalsPanel.n_m_ago", { n: Math.floor(secs / 60) });
	if (secs < 86400) return i18nT("apps.opsMissionControl.signalsPanel.n_h_ago", { n: Math.floor(secs / 3600) });
	return i18nT("apps.opsMissionControl.signalsPanel.n_d_ago", { n: Math.floor(secs / 86400) });
}
function SignalsPanel() {
	const queryClient = useQueryClient();
	const providersQuery = useQuery({
		queryKey: ["ops-mission-control", "providers"],
		queryFn: () => opsApi.providers()
	});
	const signalsQuery = useQuery({
		queryKey: SIGNALS_QUERY_KEY,
		queryFn: () => opsApi.signals(),
		enabled: false
	});
	const boardStateQuery = useQuery({
		queryKey: ["ops-mission-control", "state"],
		queryFn: () => opsApi.state(),
		enabled: false
	});
	const claimMutation = useMutation({
		mutationFn: (signal) => opsApi.claim(signal),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
			queryClient.invalidateQueries({ queryKey: SIGNALS_QUERY_KEY });
		}
	});
	const providers = providersQuery.data?.providers ?? EMPTY_PROVIDERS$1;
	const signalSources = useMemo(() => providers.filter((p) => p.roles.includes("signal")), [providers]);
	const errors = signalsQuery.data?.errors;
	const health = signalsQuery.data?.poll_health;
	const unclaimed = signalsQuery.data?.unclaimed ?? [];
	const firing = signalsQuery.data?.firing ?? [];
	const cleared = signalsQuery.data?.cleared ?? [];
	const suppressed = signalsQuery.data?.suppressed ?? [];
	const webhookQueued = boardStateQuery.data?.webhook_queue ?? 0;
	const anySignalSourceConfigured = signalSources.some((p) => p.configured);
	const unhealthySources = useMemo(() => signalSources.filter((p) => {
		const state = describeSourceHealth(p.id, health, errors, p.configured).state;
		return state === "failed" || state === "backing_off";
	}).map((p) => p.display_name), [
		signalSources,
		health,
		errors
	]);
	const pushSources = useMemo(() => signalSources.filter((p) => !describeSourceHealth(p.id, health, errors, p.configured).absenceIsEvidence).filter((p) => health?.[p.id]?.ok).map((p) => p.display_name), [
		signalSources,
		health,
		errors
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.signalsPanel.signal_sources")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-3",
					children: i18nT("apps.opsMissionControl.signalsPanel.where_work_comes_from_configure_credentials_and")
				}),
				signalsQuery.data ? !anySignalSourceConfigured ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-muted mb-3 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.signalsPanel.no_signal_source_is_configured_so_nothing_was_po") })]
				}) : signalsQuery.data.all_sources_healthy ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-ok mb-3 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						i18nT("apps.opsMissionControl.signalsPanel.every_configured_source_answered"),
						" ",
						pushSources.length > 0 ? /* @__PURE__ */ jsx(Fragment, { children: i18nT("apps.opsMissionControl.signalsPanel.push_source_absence_note", {
							sources: pushSources.join(", "),
							count: pushSources.length
						}) }) : /* @__PURE__ */ jsx(Fragment, { children: i18nT("apps.opsMissionControl.signalsPanel.a_signal_that_is_absent_from_this_poll_can_be_re") })
					] })]
				}) : /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn mb-3 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						unhealthySources.length > 0 ? i18nT("apps.opsMissionControl.signalsPanel.sources_did_not_answer_this_poll", { sources: unhealthySources.join(", ") }) : i18nT("apps.opsMissionControl.signalsPanel.at_least_one_source_did_not_answer_this_poll"),
						" ",
						i18nT("apps.opsMissionControl.signalsPanel.while_that_is_true_absence_of_a_signal_does_not")
					] })]
				}) : null,
				providersQuery.isLoading ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: i18nT("apps.opsMissionControl.signalsPanel.loading")
				}) : signalSources.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: i18nT("apps.opsMissionControl.signalsPanel.no_signal_sources_registered")
				}) : /* @__PURE__ */ jsxs("table", {
					className: "w-full text-[13px]",
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
						className: "text-muted text-left",
						children: [
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1",
								children: i18nT("apps.opsMissionControl.signalsPanel.source")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-28",
								children: i18nT("apps.opsMissionControl.signalsPanel.state")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-20 text-right pr-4",
								children: i18nT("apps.opsMissionControl.signalsPanel.firing")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-20 text-right pr-4",
								children: i18nT("apps.opsMissionControl.signalsPanel.parked")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 pl-2",
								children: i18nT("apps.opsMissionControl.signalsPanel.last_poll")
							})
						]
					}) }), /* @__PURE__ */ jsx("tbody", { children: signalSources.map((p) => {
						const status = describeSourceHealth(p.id, health, errors, p.configured);
						const count = firing.filter((s) => s.source === p.id).length;
						const parked = suppressed.filter((s) => s.source === p.id).length;
						return /* @__PURE__ */ jsxs("tr", {
							className: "border-t border-border align-top",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "py-2 pr-2",
									children: /* @__PURE__ */ jsx("span", {
										title: p.detail,
										children: p.display_name
									})
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-2",
									children: /* @__PURE__ */ jsx(Badge, {
										variant: status.variant,
										children: status.label
									})
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-2 text-right pr-4",
									children: status.contributing ? count : "—"
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-2 text-right pr-4",
									children: !status.contributing ? "—" : parked > 0 ? /* @__PURE__ */ jsx("span", {
										className: "text-warn",
										children: parked
									}) : 0
								}),
								/* @__PURE__ */ jsx("td", {
									className: "py-2 pl-2 text-muted",
									children: status.state === "failed" ? /* @__PURE__ */ jsx(ErrorNotice, {
										variant: "inline",
										className: "break-all",
										message: `${status.detail}${status.at ? ` (${age$1(status.at)})` : ""}`,
										askAgent: true
									}) : status.state === "backing_off" ? /* @__PURE__ */ jsxs("span", {
										className: "flex items-start gap-1 text-warn",
										children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", {
											className: "break-all",
											children: [status.detail, status.at ? ` (${age$1(status.at)})` : ""]
										})]
									}) : status.state === "ok" ? /* @__PURE__ */ jsxs("span", { children: [
										typeof health?.[p.id]?.signals === "number" ? i18nT("apps.opsMissionControl.signalsPanel.n_signals", { count: health[p.id].signals }) : i18nT("apps.opsMissionControl.signalsPanel.poll_answered"),
										status.at ? ` · ${age$1(status.at)}` : "",
										!status.absenceIsEvidence ? /* @__PURE__ */ jsxs("span", {
											className: "text-warn",
											title: i18nT("apps.opsMissionControl.signalsPanel.this_source_pushes_to_a_spool_that_each_poll_emp"),
											children: [" ", i18nT("apps.opsMissionControl.signalsPanel.delivered_by_push_so_an_empty_poll_means_nothing")]
										}) : null
									] }) : status.state === "not_polled" ? i18nT("apps.opsMissionControl.signalsPanel.not_polled_yet_not_the_same_as_healthy") : "—"
								})
							]
						}, p.id);
					}) })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 mt-3",
					children: [
						/* @__PURE__ */ jsxs(Btn, {
							"aria-disabled": signalsQuery.isFetching || void 0,
							className: "aria-disabled:opacity-30 aria-disabled:cursor-default",
							onClick: () => {
								if (!signalsQuery.isFetching) signalsQuery.refetch();
							},
							title: i18nT("apps.opsMissionControl.signalsPanel.poll_every_configured_source_now_read_only"),
							children: [
								/* @__PURE__ */ jsx(RefreshCw, { className: "lucide-inline" }),
								" ",
								signalsQuery.isFetching ? i18nT("apps.opsMissionControl.signalsPanel.polling") : i18nT("apps.opsMissionControl.signalsPanel.poll_now")
							]
						}),
						signalsQuery.data ? /* @__PURE__ */ jsxs("span", {
							className: "text-[12px] text-muted",
							children: [
								i18nT("apps.opsMissionControl.signalsPanel.firing_count", { count: firing.length }),
								" ",
								i18nT("apps.opsMissionControl.signalsPanel.parked_count", { count: suppressed.length }),
								" ",
								i18nT("apps.opsMissionControl.signalsPanel.cleared_count", { count: cleared.length }),
								" ",
								i18nT("apps.opsMissionControl.signalsPanel.unclaimed_count", { count: unclaimed.length }),
								firing.length === 0 && suppressed.length > 0 ? " — " + i18nT("apps.opsMissionControl.signalsPanel.nothing_firing_but_parked_signals_not_investigated") : ""
							]
						}) : null,
						signalsQuery.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
							variant: "inline",
							message: signalsQuery.error.message,
							askAgent: true
						}) : null
					]
				}),
				webhookQueued > 0 ? /* @__PURE__ */ jsxs("p", {
					className: "text-[12px] text-muted mt-2 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(Inbox, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [i18nT("apps.opsMissionControl.signalsPanel.inbound_webhook_queued", { count: webhookQueued }), webhookQueued >= 200 ? /* @__PURE__ */ jsxs("span", {
						className: "text-warn",
						children: [" ", i18nT("apps.opsMissionControl.signalsPanel.spool_full_note", { limit: 200 })]
					}) : null] })]
				}) : null
			] }),
			signalsQuery.data && suppressed.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(BellOff, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.signalsPanel.parked_at_the_provider")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.signalsPanel.someone_silenced_these_where_they_came_from_so_t")
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "flex flex-col divide-y divide-border",
					children: suppressed.map((s) => /* @__PURE__ */ jsxs("li", {
						className: "flex flex-col gap-0.5 py-2 text-[13px]",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx(Badge, {
									variant: severityVariant$1(s.severity),
									children: s.severity
								}),
								/* @__PURE__ */ jsx(Badge, {
									variant: "warn",
									children: i18nT("apps.opsMissionControl.signalsPanel.parked_2")
								}),
								/* @__PURE__ */ jsx("span", {
									className: "truncate flex-1",
									title: i18nT("apps.opsMissionControl.signalsPanel.title_resource_tooltip", {
										title: s.title,
										resource: s.resource
									}),
									children: s.title
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-[12px] text-muted shrink-0 hidden lg:inline",
									children: s.source
								}),
								safeHttpUrl(s.url) ? /* @__PURE__ */ jsx("a", {
									href: safeHttpUrl(s.url),
									target: "_blank",
									rel: "noreferrer noopener",
									className: "text-[12px] text-accent hover:underline shrink-0",
									children: i18nT("apps.opsMissionControl.signalsPanel.provider")
								}) : null
							]
						}), /* @__PURE__ */ jsx("span", {
							className: "text-[12px] text-muted pl-1",
							children: s.suppressed_reason === "inhibited" ? s.suppressed_by ? i18nT("apps.opsMissionControl.signalsPanel.inhibited_by_alert_go_look_at_that_alert", { by: s.suppressed_by }) : i18nT("apps.opsMissionControl.signalsPanel.inhibited_by_another_alert_masking_this_one") : s.suppressed_by ? i18nT("apps.opsMissionControl.signalsPanel.silenced_by_review_or_let_expire", { by: s.suppressed_by }) : i18nT("apps.opsMissionControl.signalsPanel.no_attribution_cannot_say_who_parked_it")
						})]
					}, s.id))
				})
			] }) : null,
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(Inbox, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.signalsPanel.firing_not_yet_claimed")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.signalsPanel.the_heartbeat_claims_a_few_per_cycle_so_a_burst")
				}),
				!signalsQuery.data ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: i18nT("apps.opsMissionControl.signalsPanel.poll_to_see_what_is_firing")
				}) : unclaimed.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
					icon: /* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
					title: i18nT("apps.opsMissionControl.signalsPanel.nothing_unclaimed"),
					subtitle: firing.length > 0 ? i18nT("apps.opsMissionControl.signalsPanel.everything_firing_already_has_an_incident") : suppressed.length > 0 ? i18nT("apps.opsMissionControl.signalsPanel.nothing_firing_but_signals_parked_not_picked_up", { count: suppressed.length }) : i18nT("apps.opsMissionControl.signalsPanel.no_sources_reporting_a_firing_signal")
				}) : /* @__PURE__ */ jsx("ul", {
					className: "flex flex-col divide-y divide-border",
					children: unclaimed.map((s) => /* @__PURE__ */ jsxs("li", {
						className: "flex items-center gap-2 py-2 text-[13px]",
						children: [
							/* @__PURE__ */ jsx(Badge, {
								variant: severityVariant$1(s.severity),
								children: s.severity
							}),
							/* @__PURE__ */ jsx("span", {
								className: "truncate flex-1",
								title: i18nT("apps.opsMissionControl.signalsPanel.title_resource_tooltip", {
									title: s.title,
									resource: s.resource
								}),
								children: s.title
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-[12px] text-muted shrink-0 hidden lg:inline",
								children: s.source
							}),
							safeHttpUrl(s.url) ? /* @__PURE__ */ jsx("a", {
								href: safeHttpUrl(s.url),
								target: "_blank",
								rel: "noreferrer noopener",
								className: "text-[12px] text-accent hover:underline shrink-0",
								children: i18nT("apps.opsMissionControl.signalsPanel.provider")
							}) : null,
							/* @__PURE__ */ jsx(Btn, {
								disabled: claimMutation.isPending,
								onClick: () => claimMutation.mutate(s),
								children: i18nT("apps.opsMissionControl.signalsPanel.claim")
							})
						]
					}, s.id))
				}),
				claimMutation.data ? /* @__PURE__ */ jsxs("p", {
					className: "text-[12px] mt-2",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "text-ok",
							children: [
								i18nT("apps.opsMissionControl.signalsPanel.claimed"),
								" ",
								claimMutation.data.incident.incident_id,
								"."
							]
						}),
						" ",
						/* @__PURE__ */ jsxs("span", {
							className: "text-muted",
							children: [claimMutation.data.matches.length === 0 ? i18nT("apps.opsMissionControl.signalsPanel.nothing_in_the_ledger_matched_starts_from_scratch") : (() => {
								const detail = claimMutation.data.exact_match_ids.length > 0 ? i18nT("apps.opsMissionControl.signalsPanel.n_on_own_identity_exact_match", { count: claimMutation.data.exact_match_ids.length }) : i18nT("apps.opsMissionControl.signalsPanel.all_on_shape_hash_weigh_the_fix_accordingly");
								return `${claimMutation.data.matches.length === 1 ? i18nT("apps.opsMissionControl.signalsPanel.one_ledger_entry_matched", { detail }) : i18nT("apps.opsMissionControl.signalsPanel.n_ledger_entries_matched", {
									count: claimMutation.data.matches.length,
									detail
								})} ${claimMutation.data.fast_path ? i18nT("apps.opsMissionControl.signalsPanel.proven_pattern_matched_agent_may_propose_directly") : i18nT("apps.opsMissionControl.signalsPanel.no_pattern_cleared_fast_path_agent_must_confirm")}`;
							})(), claimMutation.data.similar.length > 0 ? " " + i18nT("apps.opsMissionControl.signalsPanel.n_similar_lessons_attached_a_near_miss", { count: claimMutation.data.similar.length }) : ""]
						})
					]
				}) : null,
				claimMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
					className: "mt-2",
					message: claimMutation.error.message,
					askAgent: true
				}) : null
			] }),
			signalsQuery.data && cleared.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(CheckCircle2, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.signalsPanel.reported_recovered")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.signalsPanel.the_provider_said_these_are_back_to_normal_unlik")
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "flex flex-col divide-y divide-border",
					children: cleared.map((s) => /* @__PURE__ */ jsxs("li", {
						className: "flex items-center gap-2 py-2 text-[13px]",
						children: [
							/* @__PURE__ */ jsx(Badge, {
								variant: "ok",
								children: i18nT("apps.opsMissionControl.signalsPanel.recovered")
							}),
							/* @__PURE__ */ jsx("span", {
								className: "truncate flex-1",
								title: i18nT("apps.opsMissionControl.signalsPanel.title_resource_tooltip", {
									title: s.title,
									resource: s.resource
								}),
								children: s.title
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-[12px] text-muted shrink-0 hidden lg:inline",
								children: s.source
							}),
							safeHttpUrl(s.url) ? /* @__PURE__ */ jsx("a", {
								href: safeHttpUrl(s.url),
								target: "_blank",
								rel: "noreferrer noopener",
								className: "text-[12px] text-accent hover:underline shrink-0",
								children: i18nT("apps.opsMissionControl.signalsPanel.provider")
							}) : null
						]
					}, s.id))
				})
			] }) : null
		]
	});
}
// src/clipboard.ts
/**
* Copy text to the clipboard, restated from the dashboard's `utils/clipboard`
* (the SDK has no clipboard helper): the async API when the page has it, else
* the legacy `execCommand('copy')` over a hidden textarea. Resolves to whether
* the text reached the clipboard.
*/
async function copyToClipboard(text) {
	if (typeof navigator.clipboard?.writeText === "function") try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {}
	return execCommandCopy(text);
}
function execCommandCopy(text) {
	if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;
	const area = document.createElement("textarea");
	area.value = text;
	area.setAttribute("readonly", "");
	area.style.position = "fixed";
	area.style.opacity = "0";
	document.body.appendChild(area);
	area.select();
	try {
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		area.remove();
	}
}
// src/HandoverPanel.tsx
/**
* HandoverPanel — the shift handover digest.
*
* Hand-maintained handover documents are among the most-used artifacts a rotation has:
* at shift change nobody wants a list of every incident, they want the few things that
* will actually page them and what to do about each. Such a document costs hours of
* upkeep and goes stale between edits; everything generic in it is already data this app
* owns.
*
* Design choices worth keeping:
*
* - **The headline is the product.** Someone reading one line must get the right
*   priority, so the backend composes it (no coverage → work waiting on you → the
*   ordinary case) and this renders it prominently rather than re-deriving it.
* - **Blind spots are shown, not just coverage.** An unconfigured source is silence
*   that looks like health, and the incoming responder inherits it.
* - **Unproven patterns are visibly unproven, and refuted ones are visibly refuted.**
*   Flattening `observed/medium` into "the fix" is how a digest gets someone to apply the
*   wrong thing confidently — and a fix that was applied while the signal kept firing is
*   a third state, worse than unproven, on the entry this list ranks FIRST because the
*   failure keeps recurring.
* - **Copy-as-text is first-class.** The backend also returns a rendered text form, so
*   pasting into a handover thread and reading it here cannot word things differently.
*/
/** Module-level frozen empty so render-time fallbacks stay referentially stable. */
var EMPTY_ROWS = Object.freeze([]);
function IncidentList({ rows, emphasis }) {
	return /* @__PURE__ */ jsx("ul", {
		className: "flex flex-col divide-y divide-border",
		children: rows.map((row) => /* @__PURE__ */ jsxs("li", {
			className: "flex items-center gap-2 py-2 text-[13px]",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "font-mono text-[12px] text-muted shrink-0",
					children: row.id
				}),
				/* @__PURE__ */ jsx("span", {
					className: "truncate flex-1",
					title: row.title,
					children: row.title
				}),
				row.blocked_reason ? /* @__PURE__ */ jsx("span", {
					className: `text-[12px] shrink-0 ${emphasis ? "text-warn font-medium" : "text-muted"}`,
					children: blockedLabel(row.blocked_reason)
				}) : null,
				row.claimed_by === "operator" ? /* @__PURE__ */ jsx("span", {
					className: "text-[12px] text-muted shrink-0",
					title: i18nT("apps.opsMissionControl.handoverPanel.claimed_by_hand_not_the_heartbeat"),
					children: i18nT("apps.opsMissionControl.handoverPanel.claimed_by_hand")
				}) : null,
				/* @__PURE__ */ jsx("span", {
					className: "text-[12px] text-muted shrink-0 hidden lg:inline",
					children: row.source
				})
			]
		}, row.id))
	});
}
function HandoverPanel() {
	const [copied, setCopied] = useState(false);
	const query = useQuery({
		queryKey: ["ops-mission-control", "handover"],
		queryFn: () => opsApi.handover()
	});
	const cachedSignalsQuery = useQuery({
		queryKey: SIGNALS_QUERY_KEY,
		queryFn: () => opsApi.signals(),
		enabled: false
	});
	const providersQuery = useQuery({
		queryKey: ["ops-mission-control", "providers"],
		queryFn: () => opsApi.providers()
	});
	const digest = query.data;
	const cachedSignals = cachedSignalsQuery.data;
	/** Display names of signal sources whose last poll failed or is throttled. */
	const notAnswering = new Set(cachedSignals ? (providersQuery.data?.providers ?? []).filter((p) => p.roles.includes("signal")).filter((p) => {
		const state = describeSourceHealth(p.id, cachedSignals.poll_health, cachedSignals.errors, p.configured).state;
		return state === "failed" || state === "backing_off";
	}).map((p) => p.display_name) : []);
	const work = digest?.open_work;
	const waiting = work?.waiting_on_you ?? EMPTY_ROWS;
	const stalled = work?.stalled_without_diagnosis ?? EMPTY_ROWS;
	const escalated = work?.escalated ?? EMPTY_ROWS;
	const patterns = digest?.recurring_patterns ?? [];
	const copy = async () => {
		if (!digest?.text) return;
		if (await copyToClipboard(digest.text)) {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2e3);
		}
	};
	if (query.isLoading) return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx("p", {
		className: "text-sm text-muted",
		children: i18nT("apps.opsMissionControl.handoverPanel.building_the_digest")
	}) });
	if (query.isError) return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(ErrorNotice, {
		message: query.error.message,
		askAgent: true
	}) });
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(Clock, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.handoverPanel.handover")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm mb-3",
					children: digest?.headline
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsxs(Btn, {
							"aria-disabled": query.isFetching || void 0,
							className: "aria-disabled:opacity-30 aria-disabled:cursor-default",
							onClick: () => {
								if (!query.isFetching) query.refetch();
							},
							children: [
								/* @__PURE__ */ jsx(RefreshCw, { className: "lucide-inline" }),
								" ",
								query.isFetching ? i18nT("apps.opsMissionControl.handoverPanel.refreshing") : i18nT("apps.opsMissionControl.handoverPanel.refresh")
							]
						}),
						/* @__PURE__ */ jsxs(Btn, {
							onClick: copy,
							title: i18nT("apps.opsMissionControl.handoverPanel.copy_the_digest_as_text_for_a_handover_thread"),
							children: [
								copied ? /* @__PURE__ */ jsx(Check, { className: "lucide-inline" }) : /* @__PURE__ */ jsx(ClipboardCopy, { className: "lucide-inline" }),
								" ",
								copied ? i18nT("apps.opsMissionControl.handoverPanel.copied") : i18nT("apps.opsMissionControl.handoverPanel.copy_as_text")
							]
						}),
						digest?.autonomy?.mode ? /* @__PURE__ */ jsxs(Badge, {
							variant: digest.autonomy.mode === "observe" ? "ok" : "warn",
							children: [
								/* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline" }),
								" ",
								digest.autonomy.mode
							]
						}) : null
					]
				})
			] }),
			waiting.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(UserCheck, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.handoverPanel.waiting_on_you")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.handoverPanel.these_do_not_progress_on_their_own_an_unanswered")
				}),
				/* @__PURE__ */ jsx(IncidentList, {
					rows: waiting,
					emphasis: true
				})
			] }) : null,
			stalled.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.handoverPanel.stopped_with_no_diagnosis")
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.handoverPanel.the_investigation_ended_without_recording_anythi")
				}),
				/* @__PURE__ */ jsx(IncidentList, { rows: stalled })
			] }) : null,
			escalated.length > 0 ? /* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.handoverPanel.escalated_to_someone_else") }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mb-2",
					children: i18nT("apps.opsMissionControl.handoverPanel.handed_to_another_owner_so_no_longer_this_app_s")
				}),
				/* @__PURE__ */ jsx(IncidentList, { rows: escalated })
			] }) : null,
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.handoverPanel.what_keeps_happening") }), patterns.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
				icon: /* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
				title: i18nT("apps.opsMissionControl.handoverPanel.no_recurring_patterns_yet"),
				subtitle: i18nT("apps.opsMissionControl.handoverPanel.a_pattern_appears_here_once_the_same_failure_has")
			}) : /* @__PURE__ */ jsx("ul", {
				className: "flex flex-col divide-y divide-border mt-1",
				children: patterns.map((pat) => /* @__PURE__ */ jsxs("li", {
					className: "py-2",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-start gap-2 text-[13px]",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "font-mono text-[12px] text-muted shrink-0 w-8 text-right",
									children: [pat.uses, "×"]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "flex-1",
									children: pat.pattern
								}),
								pat.demoted ? /* @__PURE__ */ jsxs(Badge, {
									variant: "warn",
									title: i18nT("apps.opsMissionControl.handoverPanel.applied_and_the_signal_kept_firing_afterwards"),
									children: [
										i18nT("apps.opsMissionControl.handoverPanel.failed"),
										" ",
										pat.misses,
										"×"
									]
								}) : /* @__PURE__ */ jsx(Badge, {
									variant: pat.proven ? "ok" : "muted",
									children: pat.proven ? i18nT("apps.opsMissionControl.handoverPanel.pattern_proven") : `${pat.confidence}/${pat.trust}`
								})
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[12px] text-muted mt-1 pl-10",
							children: pat.fix
						}),
						pat.demoted ? /* @__PURE__ */ jsx("p", {
							className: "text-[12px] text-warn mt-1 pl-10",
							children: i18nT("apps.opsMissionControl.handoverPanel.this_fix_was_applied_and_the_signal_was_still_fi")
						}) : null
					]
				}, pat.pattern))
			})] }),
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.handoverPanel.coverage") }),
				/* @__PURE__ */ jsx("p", {
					className: "text-[13px]",
					children: digest?.coverage?.watching?.length ? i18nT("apps.opsMissionControl.handoverPanel.watching_sources", { sources: digest.coverage.watching.map((name) => notAnswering.has(name) ? i18nT("apps.opsMissionControl.handoverPanel.source_not_answering", { name }) : name).join(", ") }) : i18nT("apps.opsMissionControl.handoverPanel.watching_nothing")
				}),
				digest?.coverage?.not_configured?.length ? /* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mt-1",
					children: i18nT("apps.opsMissionControl.handoverPanel.not_configured_blind_spots", { sources: digest.coverage.not_configured.join(", ") })
				}) : null,
				!digest?.coverage?.any_watching ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn mt-2 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.handoverPanel.nothing_is_being_watched_so_a_quiet_board_means") })]
				}) : null,
				digest?.coverage?.any_watching ? !cachedSignals ? /* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-muted mt-2",
					children: i18nT("apps.opsMissionControl.handoverPanel.derived_from_configuration_only_no_source_has_be")
				}) : !cachedSignals.all_sources_healthy ? /* @__PURE__ */ jsxs("p", {
					className: "text-[13px] text-warn mt-2 flex items-start gap-1.5",
					children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }), /* @__PURE__ */ jsxs("span", { children: [
						notAnswering.size > 0 ? i18nT("apps.opsMissionControl.handoverPanel.sources_did_not_answer_the_last_poll", { sources: [...notAnswering].join(", ") }) : i18nT("apps.opsMissionControl.handoverPanel.at_least_one_source_did_not_answer_the_last_poll"),
						" ",
						i18nT("apps.opsMissionControl.handoverPanel.until_that_is_fixed_a_quiet_board_is_not_evidenc")
					] })]
				}) : /* @__PURE__ */ jsx("p", {
					className: "text-[13px] text-ok mt-2",
					children: i18nT("apps.opsMissionControl.handoverPanel.every_configured_source_answered_the_last_poll")
				}) : null
			] })
		]
	});
}
/** Slot key convention shared with the dispatch SOP: one slot per incident. */
function incidentSlotKey(incidentId) {
	return `ops-mission-control-${incidentId}`;
}
function IncidentChat({ incidentId, title }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-2 border-t border-border pt-2 flex flex-col",
		style: { height: 420 },
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-[12px] text-muted mb-2 shrink-0",
			children: i18nT("apps.opsMissionControl.incidentChat.live_investigation_header", {
				incident: incidentId,
				title: title ? ` — ${title}` : ""
			})
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 min-h-0",
			children: /* @__PURE__ */ jsx(ChatEmbed, {
				slotKey: incidentSlotKey(incidentId),
				placeholder: i18nT("apps.opsMissionControl.incidentChat.ask_about_incident", { incidentId }),
				composerMaxHeight: 160
			})
		})]
	});
}
// src/OpsMissionControlPage.tsx
/**
* Ops Mission Control — the board.
*
* Three tabs: **Board** (claimed incidents, their status, and the embedded
* investigation chat), **Signals** (source health, what the last poll returned, and
* firing signals not yet claimed — see `SignalsPanel`), and **Settings** (providers,
* autonomy, instance). The Knowledge ledger sits under the Board because it is read
* while working an incident, not while configuring one.
*
* This is an installed app page: AppHost lazy-imports this bundle and mounts it
* under the host's permission-scoped API layer, which every request here goes
* through (`api.ts` over `useAppApi().raw`), and which the investigation embed
* (`IncidentChat`) reads as well.
*
* Backend contract: backend/routes.py
* Design: docs/spec.md
*/
/** Poll fast while work is live, slowly when idle — no SSE (it clobbers state on connect). */
var POLL_ACTIVE_MS = 5e3;
var POLL_IDLE_MS = 3e4;
var EMPTY_INCIDENTS = Object.freeze([]);
var EMPTY_PROVIDERS = Object.freeze([]);
var EMPTY_LEDGER = Object.freeze([]);
/**
* Catalog KEY per status, not the English word — same shape as `FILTER_LABEL_KEY` in
* pages/chat-sidebar/SearchDock.tsx. An ALL-CAPS module constant is exempt from
* `eslint-plugin-i18next` by default, so a literal table here renders untranslated in all
* nine other languages with no gate to catch it; holding keys and resolving with `i18nT`
* at the render site puts it back under the gate.
*/
var STATUS_LABEL_KEY = {
	unclaimed: "apps.opsMissionControl.opsMissionControlPage.status_unclaimed",
	dispatched: "apps.opsMissionControl.opsMissionControlPage.status_dispatched",
	investigating: "apps.opsMissionControl.opsMissionControlPage.status_investigating",
	needs_human: "apps.opsMissionControl.opsMissionControlPage.status_needs_human",
	resolved: "apps.opsMissionControl.opsMissionControlPage.status_resolved",
	escalated: "apps.opsMissionControl.opsMissionControlPage.status_escalated",
	stale: "apps.opsMissionControl.opsMissionControlPage.status_stale"
};
/**
* What the incident is waiting for. Shown INSTEAD of the bare status, because
* "Needs human" reads identically whether the agent wants one click of approval or
* has run out of ideas — and the operator's next action is completely different.
*/
/** The row's status text: the blocked reason when blocked, else the status. */
function statusText(inc) {
	const reason = inc.blocked_reason;
	if (isKnownBlockedReason(reason)) return blockedLabel(reason);
	return i18nT(STATUS_LABEL_KEY[inc.status]);
}
function StatusIcon({ status }) {
	switch (status) {
		case "investigating":
		case "dispatched": return /* @__PURE__ */ jsx(Activity, { className: "lucide-inline text-accent" });
		case "needs_human": return /* @__PURE__ */ jsx(UserCheck, { className: "lucide-inline text-warn" });
		case "resolved": return /* @__PURE__ */ jsx(CheckCircle2, { className: "lucide-inline text-ok" });
		case "escalated": return /* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline text-danger" });
		case "stale": return /* @__PURE__ */ jsx(Clock, { className: "lucide-inline text-muted" });
		default: return /* @__PURE__ */ jsx(CircleDot, { className: "lucide-inline text-muted" });
	}
}
function severityVariant(severity) {
	if (severity === "critical") return "err";
	if (severity === "warning") return "warn";
	return "muted";
}
/** Compact relative age, e.g. "12m", "3h". */
function age(iso) {
	if (!iso) return "—";
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return "—";
	const secs = Math.max(0, Math.floor((Date.now() - then) / 1e3));
	if (secs < 60) return fmtUnit(secs, "second");
	if (secs < 3600) return fmtUnit(Math.floor(secs / 60), "minute");
	if (secs < 86400) return fmtUnit(Math.floor(secs / 3600), "hour");
	return fmtUnit(Math.floor(secs / 86400), "day");
}
/**
* A shift end as a local time, or '' when it cannot be parsed.
*
* Returns EMPTY rather than the raw string on a parse failure, and the caller then omits the
* clause entirely. `ShiftStatus.until` comes from a hand-edited `rotation.yaml` by way of
* `datetime.isoformat()`, so a malformed schedule can put anything here — and a shift badge
* reading "on shift: octocat until 2026-13-45" is worse than one that simply does not say,
* because the rest of the badge is true and the reader has no way to tell which part broke.
* The roster card already reports a schedule parse error in full.
*/
function shiftEnd(iso) {
	const at = Date.parse(iso);
	if (Number.isNaN(at)) return "";
	return fmtDateFields(at, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function ModeBadge({ mode }) {
	if (mode === "observe") return /* @__PURE__ */ jsxs(Badge, {
		variant: "ok",
		title: i18nT("apps.opsMissionControl.opsMissionControlPage.read_only_nothing_is_written_to_any_provider"),
		children: [
			/* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.opsMissionControlPage.observe")
		]
	});
	if (mode === "propose") return /* @__PURE__ */ jsxs(Badge, {
		variant: "muted",
		title: i18nT("apps.opsMissionControl.opsMissionControlPage.drafts_actions_and_asks_nothing_executes_unappro"),
		children: [
			/* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.opsMissionControlPage.propose")
		]
	});
	return /* @__PURE__ */ jsxs(Badge, {
		variant: "warn",
		title: i18nT("apps.opsMissionControl.opsMissionControlPage.executes_actions_granted_by_your_rules_every_one"),
		children: [
			/* @__PURE__ */ jsx(ShieldAlert, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.opsMissionControlPage.act")
		]
	});
}
/**
* Cache key for the closed-history list. Module-level so `transitionMutation.onSettled`
* can invalidate the exact entry the section below reads — that invalidation is what closes
* the loop: "Mark resolved" drops a row off the Board (`/state` returns only open
* incidents) and it has to reappear here, with its postmortem, in the same beat.
*/
var CLOSED_QUERY_KEY = [
	"ops-mission-control",
	"incidents",
	"closed"
];
/**
* Ledger rows the table renders. Named because the footer has to cite it: entries are sorted
* `-use_count`, which is exactly the order that pushes a REFUTED entry down, so a reader who
* sees no red rows has not seen the whole ledger and the footer says so by number.
*/
var LEDGER_ROWS_SHOWN = 25;
/** The two terminal statuses, per the status grammar (`models.TERMINAL_STATUSES`). */
var CLOSED_STATUSES = Object.freeze(["resolved", "escalated"]);
/**
* The postmortem for one closed incident, fetched on expand.
*
* Rendered VERBATIM in a `<pre>`, not through MarkdownRenderer. The point of this file is
* that it goes to somebody who does not run Kiro Crew — a ticket, a review, a colleague — so
* what the operator needs to see is the exact bytes that person will receive. A rendered
* view would quietly hide the metadata table's pipes and, worse, would make a redaction
* marker easy to miss.
*
* Fetched per expanded row rather than with the list: a closed-history list is long by
* definition and reading every artifact to show a summary nobody asked for would turn one
* request into 200 file reads.
*/
function ClosedPostmortem({ incidentId }) {
	const [copied, setCopied] = useState(false);
	const query = useQuery({
		queryKey: [
			"ops-mission-control",
			"incident",
			incidentId
		],
		queryFn: () => opsApi.incident(incidentId)
	});
	const log = query.data?.log ?? "";
	const logPath = query.data?.log_path ?? "";
	const copy = async () => {
		if (!log) return;
		if (await copyToClipboard(log)) {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2e3);
		}
	};
	if (query.isLoading) return /* @__PURE__ */ jsx("p", {
		className: "text-xs text-muted",
		children: i18nT("apps.opsMissionControl.opsMissionControlPage.reading_the_postmortem")
	});
	if (query.isError) return /* @__PURE__ */ jsx(ErrorNotice, {
		variant: "inline",
		message: query.error.message,
		askAgent: true
	});
	if (!log) return /* @__PURE__ */ jsx("p", {
		className: "text-xs text-muted",
		children: i18nT("apps.opsMissionControl.opsMissionControlPage.no_postmortem_was_written_for_this_incident_inci")
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 flex-wrap",
			children: [/* @__PURE__ */ jsxs(Btn, {
				onClick: copy,
				title: i18nT("apps.opsMissionControl.opsMissionControlPage.copy_the_postmortem_exactly_as_written_for_a_tic"),
				children: [
					copied ? /* @__PURE__ */ jsx(Check, { className: "lucide-inline" }) : /* @__PURE__ */ jsx(ClipboardCopy, { className: "lucide-inline" }),
					" ",
					copied ? i18nT("apps.opsMissionControl.opsMissionControlPage.copied") : i18nT("apps.opsMissionControl.opsMissionControlPage.copy_postmortem")
				]
			}), logPath ? /* @__PURE__ */ jsx("span", {
				className: "font-mono text-[11px] text-muted break-all",
				title: logPath,
				children: logPath
			}) : null]
		}), /* @__PURE__ */ jsx("pre", {
			className: "font-mono text-[11px] whitespace-pre-wrap break-all max-h-80 overflow-auto rounded border border-border px-2 py-1.5",
			children: log
		})]
	});
}
/**
* Closed incidents and the artifact each one left behind.
*
* Exists because the renderer that writes `incidents/<id>.md` had no reader: the file is
* this app's only output for someone who does not run Kiro Crew, and until now nothing in
* the UI called the route that returns it. `/state` deliberately carries open work only, so
* a resolved incident vanished from every surface the moment it was resolved.
*/
function ClosedIncidents() {
	const [expanded, setExpanded] = useState(null);
	const query = useQuery({
		queryKey: CLOSED_QUERY_KEY,
		queryFn: () => opsApi.incidents()
	});
	const closed = useMemo(() => (query.data?.incidents ?? EMPTY_INCIDENTS).filter((i) => CLOSED_STATUSES.includes(i.status)), [query.data]);
	return /* @__PURE__ */ jsxs(Card, {
		className: "mb-6",
		children: [/* @__PURE__ */ jsxs(CardTitle, { children: [
			/* @__PURE__ */ jsx(FileText, { className: "lucide-inline" }),
			" ",
			i18nT("apps.opsMissionControl.opsMissionControlPage.closed_postmortems")
		] }), query.isLoading ? /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted mt-2",
			children: i18nT("apps.opsMissionControl.opsMissionControlPage.loading")
		}) : query.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
			className: "mt-2",
			message: query.error.message,
			askAgent: true
		}) : closed.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted mt-2",
			children: i18nT("apps.opsMissionControl.opsMissionControlPage.nothing_has_closed_yet_when_an_incident_is_resol")
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [query.data?.truncated ? /* @__PURE__ */ jsxs("p", {
			className: "text-xs text-warn mt-1",
			children: [
				i18nT("apps.opsMissionControl.opsMissionControlPage.showing_closed_incidents", { count: closed.length }),
				" ",
				i18nT("apps.opsMissionControl.opsMissionControlPage.showing_n_of_total", {
					shown: query.data.incidents.length,
					total: query.data.total
				})
			]
		}) : null, /* @__PURE__ */ jsx("ul", {
			className: "flex flex-col divide-y divide-border mt-1",
			children: closed.map((inc) => /* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsxs("button", {
				type: "button",
				"data-testid": "omc-closed-row",
				onClick: () => setExpanded(expanded === inc.incident_id ? null : inc.incident_id),
				className: "w-full flex items-center gap-2 py-2 text-left text-sm hover:bg-bg-hover",
				children: [
					/* @__PURE__ */ jsx(StatusIcon, { status: inc.status }),
					/* @__PURE__ */ jsx("span", {
						className: "font-mono text-xs text-muted shrink-0",
						children: inc.incident_id
					}),
					/* @__PURE__ */ jsx("span", {
						className: "truncate flex-1",
						title: inc.signal.title,
						children: inc.signal.title
					}),
					/* @__PURE__ */ jsx(Badge, {
						variant: severityVariant(inc.signal.severity),
						children: inc.signal.severity
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted shrink-0 w-24 text-right",
						children: i18nT(STATUS_LABEL_KEY[inc.status])
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted shrink-0 w-10 text-right",
						children: age(inc.updated_at || inc.claimed_at)
					})
				]
			}), expanded === inc.incident_id ? /* @__PURE__ */ jsx("div", {
				className: "pb-3 pl-6 pr-2",
				children: /* @__PURE__ */ jsx(ClosedPostmortem, { incidentId: inc.incident_id })
			}) : null] }, inc.incident_id))
		})] })]
	});
}
function OpsMissionControlPage() {
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState(null);
	const [view, setView] = useState("board");
	const stateQuery = useQuery({
		queryKey: ["ops-mission-control", "state"],
		queryFn: () => opsApi.state(),
		refetchInterval: (query) => {
			return (query.state.data?.incidents ?? []).some((i) => i.status === "investigating" || i.status === "dispatched") ? POLL_ACTIVE_MS : POLL_IDLE_MS;
		}
	});
	const ledgerQuery = useQuery({
		queryKey: ["ops-mission-control", "ledger"],
		queryFn: () => opsApi.ledger(),
		refetchInterval: POLL_IDLE_MS
	});
	const cachedSignalsQuery = useQuery({
		queryKey: SIGNALS_QUERY_KEY,
		queryFn: () => opsApi.signals(),
		enabled: false
	});
	const transitionMutation = useMutation({
		mutationFn: ({ id, status }) => opsApi.transition(id, status),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
			queryClient.invalidateQueries({ queryKey: CLOSED_QUERY_KEY });
		}
	});
	const dispatchMutation = useMutation({
		mutationFn: () => opsApi.dispatch(),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "ledger"] });
		}
	});
	/**
	* Decide a drafted action.
	*
	* The `digest` passed here is the one RENDERED in the card, not one re-read at click
	* time: that is the whole point of the binding. If the draft changed underneath, the
	* route answers 409 and the operator is told the terms moved rather than silently
	* approving new ones.
	*/
	const decideMutation = useMutation({
		mutationFn: ({ id, approve, digest }) => opsApi.decideProposal(id, approve, approve ? digest : void 0),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "state"] });
			queryClient.invalidateQueries({ queryKey: ["ops-mission-control", "ledger"] });
		}
	});
	const state = stateQuery.data;
	const rotation = state?.rotation;
	const ledgerEntries = ledgerQuery.data?.entries ?? EMPTY_LEDGER;
	const incidents = state?.incidents ?? EMPTY_INCIDENTS;
	const providers = state?.providers ?? EMPTY_PROVIDERS;
	const configuredProviders = useMemo(() => providers.filter((p) => p.configured), [providers]);
	const cachedSignals = cachedSignalsQuery.data;
	const unhealthySources = useMemo(() => {
		if (!cachedSignals) return [];
		return providers.filter((p) => p.roles.includes("signal")).filter((p) => {
			const state = describeSourceHealth(p.id, cachedSignals.poll_health, cachedSignals.errors, p.configured).state;
			return state === "failed" || state === "backing_off";
		}).map((p) => p.display_name);
	}, [providers, cachedSignals]);
	const selectedIncident = useMemo(() => incidents.find((i) => i.incident_id === selected) ?? null, [incidents, selected]);
	const ledgerById = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		for (const entry of ledgerEntries) map.set(entry.entry_id, entry);
		return map;
	}, [ledgerEntries]);
	const shiftEnds = rotation?.until ? " " + i18nT("apps.opsMissionControl.opsMissionControlPage.until_shift_end", { end: shiftEnd(rotation.until) }) : "";
	const shiftLabel = rotation?.unknown ? rotation.on_shift ? i18nT("apps.opsMissionControl.opsMissionControlPage.rotation_unknown_tier_armed") : i18nT("apps.opsMissionControl.opsMissionControlPage.rotation_unknown_not_picking_up_work") : rotation?.on_shift ? rotation.who ? i18nT("apps.opsMissionControl.opsMissionControlPage.on_shift_who", {
		who: rotation.who,
		until: shiftEnds
	}) : i18nT("apps.opsMissionControl.opsMissionControlPage.on_shift", { until: shiftEnds }) : rotation?.who ? i18nT("apps.opsMissionControl.opsMissionControlPage.off_shift_who_is_on_call", {
		who: rotation.who,
		until: shiftEnds
	}) : i18nT("apps.opsMissionControl.opsMissionControlPage.off_shift");
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(PageHeader, {
		title: i18nT("apps.opsMissionControl.opsMissionControlPage.mission_control"),
		subtitle: i18nT("apps.opsMissionControl.opsMissionControlPage.autonomous_first_responder_for_your_alarms_pages"),
		actions: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [
				view === "board" ? /* @__PURE__ */ jsxs(Btn, {
					disabled: dispatchMutation.isPending,
					onClick: () => dispatchMutation.mutate(),
					title: i18nT("apps.opsMissionControl.opsMissionControlPage.poll_every_configured_source_now_and_claim_anyth"),
					children: [
						/* @__PURE__ */ jsx(RefreshCw, { className: "lucide-inline" }),
						" ",
						dispatchMutation.isPending ? i18nT("apps.opsMissionControl.opsMissionControlPage.claiming") : i18nT("apps.opsMissionControl.opsMissionControlPage.poll_and_claim")
					]
				}) : null,
				rotation ? /* @__PURE__ */ jsx(ModeBadge, { mode: rotation.mode }) : null,
				/* @__PURE__ */ jsxs(Badge, {
					variant: rotation?.on_shift || rotation?.unknown ? "ok" : "muted",
					children: [
						/* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
						" ",
						shiftLabel
					]
				})
			]
		})
	}), /* @__PURE__ */ jsxs("div", {
		className: "px-4 md:px-6 pb-8 overflow-y-auto flex-1 min-h-0",
		children: [/* @__PURE__ */ jsx("div", {
			className: "mb-4",
			children: /* @__PURE__ */ jsx(SegmentedControl, {
				segments: [
					{
						key: "board",
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.tab_board")
					},
					{
						key: "signals",
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.tab_signals")
					},
					{
						key: "handover",
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.tab_handover")
					},
					{
						key: "settings",
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.tab_settings")
					}
				],
				value: view,
				onChange: setView,
				layoutId: "omc-view"
			})
		}), view === "settings" ? /* @__PURE__ */ jsx(SettingsPanel, {}) : view === "signals" ? /* @__PURE__ */ jsx(SignalsPanel, {}) : view === "handover" ? /* @__PURE__ */ jsx(HandoverPanel, {}) : /* @__PURE__ */ jsxs(Fragment, { children: [
			dispatchMutation.data && !dispatchMutation.data.changed ? /* @__PURE__ */ jsx("p", {
				className: "text-[13px] text-muted mb-4",
				children: dispatchMutation.data.skipped_reason || (configuredProviders.length === 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.no_providers_set_up_open_settings_to_connect_one") : dispatchMutation.data.suppressed > 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.polled_summary_with_parked", {
					count: dispatchMutation.data.polled,
					polled: dispatchMutation.data.polled,
					suppressed: dispatchMutation.data.suppressed
				}) : i18nT("apps.opsMissionControl.opsMissionControlPage.polled_summary", {
					count: dispatchMutation.data.polled,
					polled: dispatchMutation.data.polled
				}))
			}) : null,
			(() => {
				const map = dispatchMutation.data?.verifications;
				if (!map) return null;
				const failed = Object.entries(map).filter(([, v]) => v === "still_firing");
				if (failed.length === 0) return null;
				const headline = failed.length === 1 ? i18nT("apps.opsMissionControl.opsMissionControlPage.verification_failed_one", { id: failed[0][0] }) : i18nT("apps.opsMissionControl.opsMissionControlPage.verification_failed_many", {
					count: failed.length,
					ids: failed.map(([id]) => id).join(", ")
				});
				return /* @__PURE__ */ jsx(ErrorNotice, {
					className: "mb-4",
					message: `${headline} ${i18nT("apps.opsMissionControl.opsMissionControlPage.expand_the_row_below_for_what_was_attempted_the")}`,
					askAgent: true
				});
			})(),
			dispatchMutation.isError ? /* @__PURE__ */ jsx(ErrorNotice, {
				className: "mb-4",
				message: dispatchMutation.error.message,
				askAgent: true
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] mb-6",
				children: [
					/* @__PURE__ */ jsx(StatCard, {
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.active"),
						value: incidents.filter((i) => i.status !== "resolved").length,
						accent: true
					}),
					/* @__PURE__ */ jsx(StatCard, {
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.waiting_on_you"),
						value: incidents.filter((i) => i.blocked_reason).length
					}),
					/* @__PURE__ */ jsx(StatCard, {
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.sources_wired"),
						value: configuredProviders.length
					}),
					/* @__PURE__ */ jsx(StatCard, {
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.patterns_known"),
						value: state?.ledger?.total ?? 0
					}),
					/* @__PURE__ */ jsx(StatCard, {
						label: i18nT("apps.opsMissionControl.opsMissionControlPage.patterns_proven"),
						value: state?.ledger?.proven ?? 0
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mb-6",
				children: /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardTitle, { children: i18nT("apps.opsMissionControl.opsMissionControlPage.board") }), stateQuery.isLoading ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: i18nT("apps.opsMissionControl.opsMissionControlPage.loading")
				}) : incidents.length === 0 ? /* @__PURE__ */ jsx(Fragment, { children: !cachedSignals ? /* @__PURE__ */ jsx(EmptyState, {
					icon: /* @__PURE__ */ jsx(Radio, { className: "lucide-inline" }),
					title: i18nT("apps.opsMissionControl.opsMissionControlPage.no_incidents_claimed"),
					subtitle: configuredProviders.length === 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.connect_a_provider_in_settings_to_start_watching") : i18nT("apps.opsMissionControl.opsMissionControlPage.source_health_not_verified_poll_from_signals_tab")
				}) : cachedSignals.all_sources_healthy ? /* @__PURE__ */ jsx(EmptyState, {
					icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline" }),
					title: i18nT("apps.opsMissionControl.opsMissionControlPage.nothing_is_firing"),
					subtitle: i18nT("apps.opsMissionControl.opsMissionControlPage.every_configured_source_answered_the_last_poll_s")
				}) : /* @__PURE__ */ jsx(EmptyState, {
					icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline" }),
					title: i18nT("apps.opsMissionControl.opsMissionControlPage.nothing_claimed_but_the_board_is_not_verified"),
					subtitle: configuredProviders.length === 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.no_source_configured_nothing_polled_connect_one") : unhealthySources.length > 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.sources_did_not_answer_absence_not_recovery", { sources: unhealthySources.join(", ") }) : i18nT("apps.opsMissionControl.opsMissionControlPage.at_least_one_source_did_not_answer_absence_not_recovery")
				}) }) : /* @__PURE__ */ jsx("ul", {
					className: "flex flex-col divide-y divide-border mt-1",
					children: incidents.map((inc) => /* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						"data-testid": "omc-incident-row",
						onClick: () => setSelected(selected === inc.incident_id ? null : inc.incident_id),
						className: "w-full flex items-center gap-2 py-2 text-left text-sm hover:bg-bg-hover",
						children: [
							/* @__PURE__ */ jsx(StatusIcon, { status: inc.status }),
							/* @__PURE__ */ jsx("span", {
								className: "font-mono text-xs text-muted shrink-0",
								children: inc.incident_id
							}),
							/* @__PURE__ */ jsx("span", {
								className: "truncate flex-1",
								title: inc.signal.title,
								children: inc.signal.title
							}),
							/* @__PURE__ */ jsx(Badge, {
								variant: severityVariant(inc.signal.severity),
								children: inc.signal.severity
							}),
							/* @__PURE__ */ jsx("span", {
								className: `text-xs shrink-0 w-32 text-right ${inc.blocked_reason ? "text-warn font-medium" : "text-muted"}`,
								children: statusText(inc)
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-xs text-muted shrink-0 w-10 text-right",
								children: age(inc.updated_at || inc.claimed_at)
							})
						]
					}), selected === inc.incident_id ? /* @__PURE__ */ jsxs("div", {
						className: "pb-3 pl-6 pr-2 flex flex-col gap-2",
						children: [
							/* @__PURE__ */ jsxs("dl", {
								className: "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs",
								children: [
									/* @__PURE__ */ jsx("dt", {
										className: "text-muted",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.source")
									}),
									/* @__PURE__ */ jsx("dd", { children: inc.signal.source }),
									/* @__PURE__ */ jsx("dt", {
										className: "text-muted",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.resource")
									}),
									/* @__PURE__ */ jsx("dd", {
										className: "truncate",
										children: inc.signal.resource || "—"
									}),
									/* @__PURE__ */ jsx("dt", {
										className: "text-muted",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.mode")
									}),
									/* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx(ModeBadge, { mode: inc.operating_mode }) }),
									/* @__PURE__ */ jsx("dt", {
										className: "text-muted",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.known_patterns")
									}),
									/* @__PURE__ */ jsx("dd", { children: inc.ledger_matches.length > 0 ? i18nT("apps.opsMissionControl.opsMissionControlPage.n_matched", { count: inc.ledger_matches.length }) : i18nT("apps.opsMissionControl.opsMissionControlPage.none_matched") }),
									/* @__PURE__ */ jsx("dt", {
										className: "text-muted",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.match_basis")
									}),
									/* @__PURE__ */ jsx("dd", { children: inc.signal.provider_key ? /* @__PURE__ */ jsx("span", { children: i18nT("apps.opsMissionControl.opsMissionControlPage.match_basis_exact", {
										source: inc.signal.source,
										key: inc.signal.provider_key.slice(0, 24)
									}) }) : /* @__PURE__ */ jsx("span", {
										className: "text-warn",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.this_provider_published_no_exact_identity_so_any")
									}) })
								]
							}),
							inc.proposed_action && inc.proposed_action.state === "pending" ? (() => {
								const p = inc.proposed_action;
								const deciding = decideMutation.isPending && decideMutation.variables?.id === inc.incident_id;
								return /* @__PURE__ */ jsxs("div", {
									className: "rounded-md border border-warn/40 bg-warn/5 p-2 flex flex-col gap-1.5",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2 text-xs",
											children: [
												/* @__PURE__ */ jsx(ShieldCheck, { className: "lucide-inline text-warn" }),
												/* @__PURE__ */ jsx("span", {
													className: "font-medium",
													children: i18nT("apps.opsMissionControl.opsMissionControlPage.awaiting_your_approval")
												}),
												/* @__PURE__ */ jsx(Badge, {
													variant: "warn",
													children: p.action
												}),
												/* @__PURE__ */ jsx("span", {
													className: "text-muted",
													children: p.duration_secs ? i18nT("apps.opsMissionControl.opsMissionControlPage.through_sink_for_duration", {
														sink: p.sink,
														duration: fmtUnit(p.duration_secs, "second")
													}) : i18nT("apps.opsMissionControl.opsMissionControlPage.through_sink", { sink: p.sink })
												}),
												/* @__PURE__ */ jsx("span", {
													className: "text-muted ml-auto",
													children: i18nT("apps.opsMissionControl.opsMissionControlPage.expires_at_time", { time: fmtDateFields(p.expires_at, {
														month: "short",
														day: "numeric",
														hour: "numeric",
														minute: "2-digit"
													}) })
												})
											]
										}),
										p.note ? /* @__PURE__ */ jsx("pre", {
											className: "text-[11px] font-mono whitespace-pre-wrap bg-bg-elevated rounded p-1.5 m-0",
											children: p.note
										}) : null,
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsxs(Btn, {
												disabled: deciding,
												onClick: () => decideMutation.mutate({
													id: inc.incident_id,
													approve: true,
													digest: p.digest
												}),
												children: [
													/* @__PURE__ */ jsx(Check, { className: "lucide-inline" }),
													" ",
													i18nT("apps.opsMissionControl.opsMissionControlPage.approve_and_run")
												]
											}), /* @__PURE__ */ jsx(Btn, {
												disabled: deciding,
												onClick: () => decideMutation.mutate({
													id: inc.incident_id,
													approve: false,
													digest: p.digest
												}),
												children: i18nT("apps.opsMissionControl.opsMissionControlPage.reject")
											})]
										}),
										deciding ? null : decideMutation.isError && decideMutation.variables?.id === inc.incident_id ? /* @__PURE__ */ jsx(ErrorNotice, {
											message: decideMutation.error.message,
											askAgent: true
										}) : decideMutation.data && decideMutation.variables?.id === inc.incident_id && !decideMutation.data.ok ? /* @__PURE__ */ jsx(ErrorNotice, {
											message: decideMutation.data.error || i18nT("apps.opsMissionControl.opsMissionControlPage.the_decision_was_refused"),
											askAgent: true
										}) : null
									]
								});
							})() : null,
							(() => {
								const view = describeVerification(inc);
								if (!view) return null;
								const tone = view.variant === "err" ? "text-danger" : view.variant === "warn" ? "text-warn" : view.variant === "ok" ? "text-ok" : "text-muted";
								return /* @__PURE__ */ jsxs("div", {
									className: "rounded border border-border px-2 py-1.5 text-xs",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-1.5 flex-wrap",
											children: [
												view.variant === "err" ? /* @__PURE__ */ jsx(AlertTriangle, { className: "lucide-inline text-danger" }) : view.variant === "ok" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "lucide-inline text-ok" }) : /* @__PURE__ */ jsx(Clock, { className: "lucide-inline text-muted" }),
												/* @__PURE__ */ jsxs("span", {
													className: "text-muted",
													children: [
														inc.last_action || "action",
														" ",
														inc.last_action_at ? i18nT("apps.opsMissionControl.opsMissionControlPage.sent_n_ago", { age: age(inc.last_action_at) }) : i18nT("apps.opsMissionControl.opsMissionControlPage.sent"),
														" ",
														"—"
													]
												}),
												/* @__PURE__ */ jsx("span", {
													className: tone,
													children: view.label
												})
											]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-1 text-muted",
											children: view.meaning
										}),
										inc.verification_detail ? /* @__PURE__ */ jsx("p", {
											className: "mt-1",
											children: inc.verification_detail
										}) : null
									]
								});
							})(),
							inc.ledger_matches.length > 0 ? /* @__PURE__ */ jsx("div", {
								className: "flex flex-col gap-1.5",
								children: inc.ledger_matches.map((entryId) => {
									const entry = ledgerById.get(entryId);
									if (!entry) return /* @__PURE__ */ jsxs("p", {
										className: "text-xs text-muted",
										children: [
											i18nT("apps.opsMissionControl.opsMissionControlPage.matched_entry"),
											" ",
											entryId.slice(0, 8),
											" ",
											i18nT("apps.opsMissionControl.opsMissionControlPage.is_no_longer_in_the_ledger")
										]
									}, entryId);
									return /* @__PURE__ */ jsxs("div", {
										className: "rounded border border-border px-2 py-1.5 text-xs",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-1.5 flex-wrap",
												children: [
													/* @__PURE__ */ jsx("span", {
														className: entry.trust === "verified" ? "text-ok" : "text-warn",
														children: entry.trust
													}),
													/* @__PURE__ */ jsx("span", {
														className: "text-muted",
														children: "·"
													}),
													/* @__PURE__ */ jsxs("span", {
														className: "text-muted",
														children: [
															entry.confidence,
															" ",
															i18nT("apps.opsMissionControl.opsMissionControlPage.confidence")
														]
													}),
													/* @__PURE__ */ jsx("span", {
														className: "text-muted",
														children: "·"
													}),
													/* @__PURE__ */ jsxs("span", {
														className: "text-muted",
														children: [
															i18nT("apps.opsMissionControl.opsMissionControlPage.used"),
															" ",
															entry.use_count,
															"×"
														]
													}),
													entry.miss_count > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
														className: "text-muted",
														children: "·"
													}), /* @__PURE__ */ jsxs("span", {
														className: "text-danger",
														children: [
															i18nT("apps.opsMissionControl.opsMissionControlPage.failed"),
															" ",
															entry.miss_count,
															"×"
														]
													})] }) : null,
													/* @__PURE__ */ jsx(Badge, {
														variant: entryIsProven(entry) ? "ok" : "muted",
														children: entryIsProven(entry) ? i18nT("apps.opsMissionControl.opsMissionControlPage.proven_agent_may_propose_directly") : i18nT("apps.opsMissionControl.opsMissionControlPage.hypothesis_agent_must_confirm_first")
													})
												]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-1",
												children: entry.pattern
											}),
											/* @__PURE__ */ jsx("p", {
												className: "mt-0.5 text-muted",
												children: /* @__PURE__ */ jsx("span", {
													className: "text-text",
													children: i18nT("apps.opsMissionControl.opsMissionControlPage.fix_label", { fix: entry.fix })
												})
											}),
											entry.miss_count > 0 ? /* @__PURE__ */ jsx("p", {
												className: "mt-1 text-warn",
												children: i18nT("apps.opsMissionControl.opsMissionControlPage.demoted_note", { recent: entry.last_miss ? ` (most recently ${entry.last_miss})` : "" })
											}) : null,
											!entryIsProven(entry) && entry.miss_count === 0 && entry.trust === "verified" && entry.confidence === "high" ? /* @__PURE__ */ jsxs("p", {
												className: "mt-1 text-muted",
												children: [
													i18nT("apps.opsMissionControl.opsMissionControlPage.marked_verified_and_high_confidence_but_used_onl"),
													" ",
													entry.use_count,
													i18nT("apps.opsMissionControl.opsMissionControlPage.anyone_can_record_those_two_values_so_the_fast_p"),
													" ",
													2,
													" ",
													i18nT("apps.opsMissionControl.opsMissionControlPage.uses_before_an_agent_proposes_it_without_checkin")
												]
											}) : null
										]
									}, entryId);
								})
							}) : null,
							inc.diagnosis ? /* @__PURE__ */ jsx("p", {
								className: "text-sm whitespace-pre-wrap",
								children: inc.diagnosis
							}) : /* @__PURE__ */ jsx("p", {
								className: "text-sm text-muted",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.no_diagnosis_recorded_yet")
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 flex-wrap",
								children: [safeHttpUrl(inc.signal.url) ? /* @__PURE__ */ jsx("a", {
									href: safeHttpUrl(inc.signal.url),
									target: "_blank",
									rel: "noreferrer noopener",
									className: "text-xs text-accent hover:underline",
									children: i18nT("apps.opsMissionControl.opsMissionControlPage.open_in_provider")
								}) : null, inc.status === "investigating" || inc.status === "needs_human" ? /* @__PURE__ */ jsx(Btn, {
									disabled: transitionMutation.isPending,
									onClick: () => transitionMutation.mutate({
										id: inc.incident_id,
										status: "resolved"
									}),
									children: i18nT("apps.opsMissionControl.opsMissionControlPage.mark_resolved")
								}) : null]
							}),
							transitionMutation.isError && selectedIncident?.incident_id === inc.incident_id ? /* @__PURE__ */ jsx(ErrorNotice, {
								message: transitionMutation.error.message,
								askAgent: true
							}) : null,
							transitionMutation.data && transitionMutation.variables?.id === inc.incident_id ? transitionMutation.data.slack_thread_replyable ? /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ok",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.replies_in_the_slack_thread_reach_this_investiga")
							}) : /* @__PURE__ */ jsx("p", {
								className: "text-xs text-warn",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.replies_in_the_slack_thread_will_not_reach_this")
							}) : null,
							/* @__PURE__ */ jsx(IncidentChat, {
								incidentId: inc.incident_id,
								title: inc.signal.title
							})
						]
					}) : null] }, inc.incident_id))
				})] })
			}),
			/* @__PURE__ */ jsx(ClosedIncidents, {}),
			rotation?.roster?.members?.length ? /* @__PURE__ */ jsxs(Card, {
				className: "mb-4",
				children: [
					/* @__PURE__ */ jsxs(CardTitle, { children: [
						/* @__PURE__ */ jsx(Users, { className: "lucide-inline" }),
						" ",
						i18nT("apps.opsMissionControl.opsMissionControlPage.on_call_team"),
						/* @__PURE__ */ jsx("span", {
							className: "text-[12px] text-muted font-normal ml-2",
							children: rotation.roster.strict_gating ? i18nT("apps.opsMissionControl.opsMissionControlPage.timezone_only_on_call_instance_picks_up_work", { timezone: rotation.roster.timezone }) : rotation.roster.timezone
						})
					] }),
					/* @__PURE__ */ jsx("ul", {
						className: "flex flex-col gap-1 mt-2",
						children: rotation.roster.members.map((m) => {
							const isMe = !!rotation.roster?.me && m.login === rotation.roster.me;
							const rosterLeader = rotation.roster?.leader ?? "";
							return /* @__PURE__ */ jsxs("li", {
								className: "flex items-center gap-2 text-sm py-1",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: m.on_call_now ? "text-ok" : "text-muted",
										children: /* @__PURE__ */ jsx(Radio, { className: "lucide-inline" })
									}),
									/* @__PURE__ */ jsx("span", {
										className: isMe ? "font-semibold text-text-strong" : "",
										children: isMe ? i18nT("apps.opsMissionControl.opsMissionControlPage.member_is_this_instance", { login: m.login }) : m.login
									}),
									m.on_call_now ? /* @__PURE__ */ jsx(Badge, {
										variant: "ok",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.on_call_now")
									}) : null,
									rosterLeader && m.login.toLowerCase() === rosterLeader.toLowerCase() ? /* @__PURE__ */ jsx(Badge, {
										variant: "muted",
										title: i18nT("apps.opsMissionControl.opsMissionControlPage.runs_nightly_ledger_hygiene_for_the_team"),
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.leader")
									}) : null,
									/* @__PURE__ */ jsx("span", {
										className: "text-[12px] text-muted ml-auto",
										children: i18nT("apps.opsMissionControl.opsMissionControlPage.shift", { count: m.shifts })
									})
								]
							}, m.login);
						})
					}),
					rotation.roster.me && !rotation.roster.me_on_roster && rotation.roster.strict_gating ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-warn mt-2",
						children: i18nT("apps.opsMissionControl.opsMissionControlPage.not_on_roster_strict", { me: rotation.roster.me })
					}) : null,
					rotation.roster.me && !rotation.roster.me_on_roster && !rotation.roster.strict_gating ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted mt-2",
						children: i18nT("apps.opsMissionControl.opsMissionControlPage.not_on_roster_lenient", { me: rotation.roster.me })
					}) : null,
					!rotation.roster.me ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-warn mt-2",
						children: i18nT("apps.opsMissionControl.opsMissionControlPage.no_github_login_resolved_for_this_instance_so_it")
					}) : null,
					rotation.roster.error ? /* @__PURE__ */ jsx(ErrorNotice, {
						className: "mt-2",
						message: i18nT("apps.opsMissionControl.opsMissionControlPage.schedule_problem", { error: rotation.roster.error }),
						askAgent: true
					}) : null
				]
			}) : null,
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsxs(CardTitle, { children: [
					/* @__PURE__ */ jsx(BookOpen, { className: "lucide-inline" }),
					" ",
					i18nT("apps.opsMissionControl.opsMissionControlPage.knowledge_ledger")
				] }),
				ledgerEntries.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted mt-2",
					children: i18nT("apps.opsMissionControl.opsMissionControlPage.empty_each_investigation_that_finds_a_reusable_f")
				}) : /* @__PURE__ */ jsxs("table", {
					className: "w-full text-xs mt-2",
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
						className: "text-muted text-left",
						children: [
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.pattern")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-24",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.confidence_2")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-20",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.trust")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-16 text-right",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.used_2")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-16 text-right",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.failed_2")
							}),
							/* @__PURE__ */ jsx("th", {
								className: "font-normal py-1 w-28",
								children: i18nT("apps.opsMissionControl.opsMissionControlPage.fast_path")
							})
						]
					}) }), /* @__PURE__ */ jsx("tbody", { children: ledgerEntries.slice(0, LEDGER_ROWS_SHOWN).map((entry) => /* @__PURE__ */ jsxs("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ jsx("td", {
								className: "py-1.5 pr-2",
								children: /* @__PURE__ */ jsx("span", {
									title: entry.fix,
									children: entry.pattern
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "py-1.5",
								children: entry.confidence
							}),
							/* @__PURE__ */ jsx("td", {
								className: "py-1.5",
								children: /* @__PURE__ */ jsx(Badge, {
									variant: entry.trust === "verified" ? "ok" : "muted",
									children: entry.trust
								})
							}),
							/* @__PURE__ */ jsxs("td", {
								className: "py-1.5 text-right",
								children: [entry.use_count, "×"]
							}),
							/* @__PURE__ */ jsx("td", {
								className: `py-1.5 text-right ${entry.miss_count > 0 ? "text-danger" : "text-muted"}`,
								children: entry.miss_count > 0 ? `${entry.miss_count}×` : "—"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "py-1.5",
								children: entry.miss_count > 0 ? /* @__PURE__ */ jsx(Badge, {
									variant: "warn",
									title: i18nT("apps.opsMissionControl.opsMissionControlPage.this_fix_was_applied_and_the_signal_kept_firing"),
									children: i18nT("apps.opsMissionControl.opsMissionControlPage.demoted")
								}) : /* @__PURE__ */ jsx(Badge, {
									variant: entryIsProven(entry) ? "ok" : "muted",
									children: entryIsProven(entry) ? i18nT("apps.opsMissionControl.opsMissionControlPage.ledger_entry_unlocked") : i18nT("apps.opsMissionControl.opsMissionControlPage.ledger_entry_locked")
								})
							})
						]
					}, entry.entry_id)) })]
				}),
				ledgerEntries.length > 0 ? /* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted mt-2",
					children: [
						i18nT("apps.opsMissionControl.opsMissionControlPage.unlocked_means_an_investigation_may_propose_this"),
						" ",
						2,
						" ",
						i18nT("apps.opsMissionControl.opsMissionControlPage.uses_and_no_recorded_failure_a_locked_entry_is_s")
					]
				}) : null,
				state?.ledger?.demoted ? /* @__PURE__ */ jsx("p", {
					className: "text-xs text-warn mt-1",
					children: state.ledger.demoted === 1 ? i18nT("apps.opsMissionControl.opsMissionControlPage.demoted_refuted_summary_singular", {
						demoted: state.ledger.demoted,
						total: state.ledger.total,
						rows: LEDGER_ROWS_SHOWN
					}) : i18nT("apps.opsMissionControl.opsMissionControlPage.demoted_refuted_summary_plural", {
						demoted: state.ledger.demoted,
						total: state.ledger.total,
						rows: LEDGER_ROWS_SHOWN
					})
				}) : null
			] })
		] })]
	})] });
}
// src/index.tsx
/**
* The bundle's entry: AppHost lazy-imports this module and renders its default
* export as the app's page.
*
* Subscribing to the host's language generation here is what repaints the page
* on a language switch: `t` reads the active locale at call time, and this
* component's re-render reaches every child. The host's scoped API client is
* bound here too, before the page's first request (see `appApi.ts`). The host
* mounts the page inside its own React Query client.
*/
function OpsMissionControlApp() {
	useLanguageGeneration();
	bindAppApi(useAppApi());
	return /* @__PURE__ */ jsx(OpsMissionControlPage, {});
}
export { OpsMissionControlApp as default };
