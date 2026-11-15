"""Build the 50-page WILD-AI project report from the current repository record."""

from pathlib import Path
import subprocess
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = Path(__file__).with_name('WILD_AI_Project_Report_50_Pages.docx')

PAGES = [
    # page, chapter, title, paragraphs, optional table/figure
    (9, '1', 'Introduction: Project Context', [
        'WILD-AI is an Android field assistant for hikers and trekkers in Uttarakhand. Its first working build combines a chat interface, an offline set of sourced regional records, optional online information, and an experimental plant photograph classifier. The central design constraint is that a user may lose connectivity exactly when information becomes useful. Therefore the application must remain understandable and capable of giving its reviewed core answers without a server [1].',
        'The system is a prototype rather than an authoritative survival or medical product. It presents documented plant occurrence and limited food-use records without claiming that a particular plant found on a trail has been identified or is safe to eat. It gives a clear abstention when evidence is missing, a question is outside coverage, or a safety decision needs qualified human help. This distinction governs both interface wording and software routing.',
        'The immediate product target is a small, supervised field pilot of approximately five to ten users. The initial geographic interest is Mussoorie, Landour, Dehradun and wider Uttarakhand, while the software permits a user to choose the state or one of its districts. This report documents the implemented system, evidence gathered so far, its limitations, and the work required before a public release.'
    ], None),
    (10, '1', 'Problem Statement', [
        'A person outdoors may have intermittent network service, a limited battery, and little time to compare several web pages. A conventional web search can surface generic advice that ignores the user’s selected region or fails to distinguish an occurrence record from an identification. A photo recognition system can make a plausible but harmful prediction on an unseen plant. WILD-AI therefore needs to answer narrow, supported questions quickly and signal uncertainty plainly.',
        'The engineering problem is to join four kinds of information with different reliability levels: curated offline records, saved region notes, open web summaries, and machine-generated text or vision suggestions. If these are blended into one unlabelled answer, users can mistake unreviewed material for verified guidance. The application instead records provenance, labels each response route, and blocks the online language model from safety topics [1, 2].',
        'Success for the prototype is a usable offline-first conversation flow, persistent local history and attachments, region selection, source-linked retrieval, feedback capture, and an experimental photo path that can abstain. Success for a real field release is more demanding: expert content review, independent model evaluation, representative offline tests, and a controlled pilot. Those release gates are not yet complete.'
    ], None),
    (11, '1', 'Objectives and Expected Outcomes', [
        'The first objective is to make documented local information available when the phone is offline. The application bundles a finite knowledge pack and answers supported queries through region and term matching, returning fixed text and source links. The second objective is to provide one simple chat surface that accepts typed questions and photographs, with saved conversations that survive app restart.',
        'The third objective is to explore photo identification without portraying it as a safety decision. The current standalone pilot APK contains a twelve-species research model and exposes either a tentative species suggestion or an unknown result. Release builds exclude this unvalidated model. The fourth objective is to support graceful online enrichment: linked encyclopedia summaries and an operator-hosted source-grounded model service for general questions, while keeping provider credentials off the phone [1, 3].',
        'The expected outcome of this report is a transparent account of what exists, what was tested, and what remains open. The project should be assessable by functionality, architecture, data provenance, model evidence, user experience, privacy, and release readiness. It must not be judged by the presence of a prediction alone; a safe refusal is an intended result when the system lacks evidence.'
    ], [('Objective', 'Prototype evidence'), ('Offline question answering', 'Bundled pack and source-linked answer route'), ('Photo support', 'Camera/gallery attachment and experimental classifier'), ('Continuity', 'Local chat, photo, notes, and feedback persistence')]),
    (12, '1', 'Project Scope and Boundaries', [
        'The application targets English-language Android use. A user can select Uttarakhand statewide or a named district; the available information varies by location. Mussoorie and Landour are represented through the Dehradun selection. The offline pack presently includes twenty-five documented plant records, five limited fruit food-use records, and a small set of field topics. It is intentionally incomplete and does not mean that every species occurs on every route [1, 4].',
        'The current photo model covers twelve classes, below the planned twenty to thirty classes. It is installed only in debug and standalone pilot variants. The online model service is implemented in code but has not been configured with a production HTTPS endpoint or credentials. A downloadable region note is a short saved set of encyclopedia summaries, not a map tile pack or an expert-reviewed local guide.',
        'This report does not assert that the application identifies edible plants, treats injuries, replaces a guide, supplies live weather, or guarantees cellular emergency access. The intended pilot is supervised and release-gated. Stating these boundaries is essential because a visually polished application could otherwise create a stronger impression of reliability than the underlying data supports.'
    ], None),
    (13, '1', 'Stakeholders and User Scenarios', [
        'The primary user is a hiker or trekker seeking quick context on an unfamiliar route. Secondary stakeholders include the project owner, pilot participants, botanical reviewers, field safety reviewers, and the operator of any online model service. A reviewer needs evidence of the source and coverage behind a claim; the operator needs to maintain credentials and limits without exposing them in the APK.',
        'A typical offline scenario starts before a trek: the user chooses a district and optionally downloads short region notes while connected. Later, the user asks about a documented tree or a field topic with no signal. The bundled pack returns a source-labelled answer, or states that no reviewed answer is available. The chat and any attached photos remain on the phone.',
        'A second scenario starts with a plant photo. The app stores the photo in app-private storage and asks the experimental on-device model for a tentative result. If the model abstains, the conversation shows “unknown” rather than a forced class. A third scenario is feedback: the user marks an answer as missing or incorrect, writes a note, and retains that report locally until choosing to share it. These scenarios drive the use cases and verification plan.'
    ], None),
    (14, '2', 'Related Work: Offline Mobile Field Guides', [
        'Traditional field guides arrange information by region and taxon, often with visual keys and descriptions. They are valuable because content can be reviewed before distribution, but they may be hard to search quickly in a stressful field setting. WILD-AI adapts the reviewed-guide pattern to a compact, searchable mobile record. It does not turn a local name or a matching photograph into a positive safety decision.',
        'Offline-first mobile design stores the minimum useful material on the device and treats network access as an enhancement. For this project, that means a bundled knowledge pack and emergency contact information are available without downloading anything after installation. User-selected supplemental notes can be saved for later, but their origin and lower review status remain visible [1, 2].',
        'The comparison illustrates a trade-off. A fixed offline pack offers predictable wording, traceable sources, and low latency, while it cannot answer every new question or provide live conditions. An online search may broaden coverage but also introduces availability, freshness, and source-quality uncertainty. WILD-AI uses separate labelled routes so the user can understand which kind of result they are reading.'
    ], None),
    (15, '2', 'Related Work: Image Classification in the Field', [
        'A plant image classifier commonly resizes a photograph, extracts visual features with an image encoder, and chooses a species class. Standard closed-set testing assumes that every test image belongs to one of the trained classes. Field photographs violate that assumption: the user may submit an unseen plant, bark rather than leaves, a blurry scene, or even a non-plant object. A credible field application therefore needs an explicit rejection path.',
        'The project explored MobileNet-based TFLite classifiers and plant-pretrained ONNX encoders with a support vector machine and a novelty gate. Those experiments demonstrate a feasible Android inference path, not release-quality recognition. The reported held-out split did not independently separate all photographers, devices, routes, or dates. Later disjoint-species stress tests exposed a much higher unknown acceptance rate than the original small unknown set [5, 6].',
        'For user experience, the classifier output is described as a possible match and never as an edibility, toxicity, or treatment conclusion. This is a necessary system boundary. Better classification accuracy alone would not establish whether a wild specimen is safe to handle or consume; the botanical label, relevant plant part, season, local variation, and expert review would still matter.'
    ], None),
    (16, '2', 'Related Work: Retrieval-Augmented Answers', [
        'Retrieval-augmented generation normally retrieves passages and lets a language model compose an answer. The implemented offline WILD-AI route is narrower: it selects curated records using region, topic words, and species names, then assembles fixed passages with source links. It is an offline retrieval-augmented answer system without embeddings or open-ended generation. Its small vocabulary limits recall, but its answer text remains auditable [1, 2].',
        'When configured, the online service retrieves a few encyclopedia excerpts and asks an open-weight hosted model to answer only from those numbered excerpts. Recent conversation turns help resolve references but are not treated as evidence. The service instructs the model to say when the excerpts are insufficient. The client labels the resulting text as unreviewed, since a model can still misread a source, omit context, or create an unsupported statement [3].',
        'The main lesson from this comparison is that retrieval quality, evidence scope, and refusal behaviour matter as much as model choice. A semantic index could improve recall in a future version, but it should be adopted only after evaluating representative questions and ensuring that broad matches do not weaken safety abstention.'
    ], None),
    (17, '2', 'Related Work: Connected Assistance', [
        'Connected AI services can interpret a broad range of natural-language questions and maintain conversational context, but they require bandwidth, service availability, a budget, and privacy controls. A provider’s prototype tier may not be suitable for public production [7]. WILD-AI keeps the provider token on an operator-controlled server and gives participants an APK that already contains the service address and short-lived pilot access code [1, 3].',
        'The service uses a HTTPS deployment in the intended configuration, a bearer code, a request-size limit, a small hourly per-IP limit, bounded question/history lengths, and a safety-topic filter. These controls reduce misuse in a five-to-ten-person pilot, but a code embedded in an APK can be extracted and the in-memory rate limit is only suitable for one server process. A scaled service requires proper authentication, shared rate limits, logging policy, and cost monitoring.',
        'A lightweight on-device text model was considered for summaries. It is not included in the present build because a roughly gigabyte-scale model would materially change app size, memory, battery use, and latency on the mid-range Android target. The offline chat history remains available without it, and the configured online path receives only bounded recent text turns.'
    ], None),
    (18, '2', 'Research Gap and Design Position', [
        'The difficulty in this project is not the absence of plant names or general-purpose language models. It is the gap between a plausible answer and a dependable field decision. Data found on the internet may have uncertain local coverage, a photograph may be mislabelled, and a generative model may produce fluent but unsupported wording. A user interface that hides these weaknesses can magnify risk.',
        'WILD-AI addresses that gap through source provenance, explicit geographic scope, separate reliability labels, local persistence, and refusal on unresolved safety questions. A plant occurrence record is stored with a source and area. A model prediction is presented as experimental. A general online summary is marked unreviewed. A failed network request leaves the offline answer intact rather than replacing it with an error [1, 2].',
        'The project also exposes an evaluation gap. The current photo model has measured research performance, but no independent Uttarakhand field set. The application should not be released as a plant safety tool until botanists verify labels and look-alikes, independent users test real photographs, and the system is evaluated on harmful false acceptance and abstention, not only ordinary accuracy.'
    ], None),
    (19, '3', 'Functional Requirements', [
        'The user-facing functional requirements are: select a region; ask a typed question; view a response and its sources or a clear refusal; attach or capture a photograph; browse and resume saved conversations; download available short notes for a region; view emergency contacts; and submit local feedback. The chat surface is deliberately primary, while configuration and saved items live in a drawer [1].',
        'The application must answer known offline topics without a connection. It must route medical, toxicity, found-plant edibility, and related identification questions away from unreviewed online generation. It must permit the photo classifier to reject a low-confidence or out-of-scope input. Online enrichment is optional: a search or hosted model failure must not remove the local answer.',
        'Administrative requirements are separate from end-user requirements. The owner curates sources and approves content; a qualified reviewer signs off safety-related material; the service operator configures credentials and monitors quota; the model curator records photo provenance, label order, splits, evaluation and deployment status. The user should never be asked to provide an AI provider API key.'
    ], [('ID', 'Requirement'), ('FR-1', 'Offline sourced question answering'), ('FR-2', 'Photo attach, candidate prediction, abstention'), ('FR-3', 'Persist chat, photos, notes and feedback'), ('FR-4', 'Optional, labelled online research')]),
    (20, '3', 'Non-Functional Requirements', [
        'Reliability requires the app to start without Metro, keep core content available in airplane mode, and preserve a conversation after process termination. Responsiveness should be measured on a mid-range Android phone for startup, opening a saved chat, camera attachment, and on-device inference. The current project has demonstrated a standalone pilot APK, but it has not completed a representative battery, memory, thermal, or latency study [1, 5].',
        'Privacy requires conversation text, saved photographs, downloaded notes, and feedback to stay in app-private storage unless a user takes an explicit share action or uses a connected feature. A general online search sends the query and selected region to Wikimedia. The hosted model path also sends up to twelve recent text turns to the operator service and model provider; photographs are not sent. The user interface should make this boundary intelligible.',
        'Accessibility requires readable contrast, useful touch targets, proper keyboard behaviour, and support for Android reduced motion. Maintainability requires the source ledger, model metadata, and release status to be versioned. Safety requires conservative wording, a visible source or provenance label, and refusal where the pack cannot justify an answer.'
    ], None),
    (21, '3', 'Constraints, Assumptions and Risks', [
        'The pilot is limited to English, Android, and a small number of participants. Coverage differs among Uttarakhand regions; selecting a district is a filter, not a claim of complete local knowledge. Phone calls need cellular service even when the application itself works offline. The debug-key-signed standalone APK is a test artefact and is unsuitable for Google Play distribution [1].',
        'Important data risks include mistaken plant labels, duplicate images crossing data splits, geographic overgeneralization, and unclear permission to use a photograph for training. Model risks include false acceptance of unknown species and class-specific weakness. Interaction risks include users reading the word “possible” as certainty, trusting a source link without understanding its scope, or relying on old downloaded information as live conditions.',
        'Engineering risks include an interrupted download, full device storage, a damaged chat store, expiring hosted-model access, or online answers that ignore retrieved excerpts. Controls include conservative default answers, local save error notices, visible source labels, a candidate-only classifier status, limited online request sizes, and a formal gate before any safety-sensitive field use.'
    ], [('Risk', 'Control'), ('Unknown plant accepted', 'Open-set tests and visible abstention'), ('Unreviewed guidance treated as fact', 'Distinct labels and blocked safety route'), ('Network loss', 'Bundled offline pack remains primary')]),
    (22, '3', 'Use Cases and User Journey', [
        'Use case UC-1 begins when the user selects Uttarakhand or a district from the drawer. The app saves that choice in a conversation. If no record applies to the selected area, the result should say so rather than borrowing a nearby district’s information. Use case UC-2 starts with a typed question. The local retrieval route returns a supported answer, a contact answer, or an abstention; optional online enrichment follows only when the question is allowed [1, 2].',
        'Use case UC-3 begins when the user opens the attachment menu and chooses camera or gallery. The selected image is copied to app-private storage so a temporary external URI cannot break the saved chat. The pilot classifier then gives a tentative result or unknown result. Use case UC-4 allows the user to review earlier conversations. Messages, answer labels, source links, and photographs remain with the thread.',
        'Use case UC-5 stores feedback for a selected assistant answer. A user can later export the saved feedback as JSON for review; nothing is uploaded automatically. Use case UC-6 downloads short unreviewed notes for a region while online. Later, those notes can help answer a general query but never override a reviewed safety answer. Emergency contacts originate from the state authority [8].'
    ], None),
    (23, '3', 'Requirement Traceability', [
        'Requirements are useful only when the team can point to the implementation and the verification evidence. Table 3.3 maps the principal requirements to existing modules and checks. The mapping does not claim that tests are a substitute for field validation: unit tests exercise code paths, whereas outdoor reliability needs observed use on real devices and independent content review.',
        'The most important boundary is between a feature being present and a claim being validated. The app can attach and classify an image, yet the model is not ready for release. It can present emergency numbers, yet those numbers must be rechecked before a pilot and the phone must have cellular service. It can query online sources, yet a public endpoint is not configured. The report uses “implemented,” “tested,” and “release ready” as different states.',
        'Traceability should be updated whenever an answer source, model archive, or region pack changes. A model label change can invalidate native metadata and class ordering; a source change can alter safety wording; a navigation change can hide feedback. Each such change should be followed by its narrow corresponding test and a small user-device check.'
    ], [('Requirement', 'Module', 'Current evidence'), ('Offline answers', 'src/answerQuestion.ts', 'Unit tests and APK'), ('Chat history', 'src/chatHistory.ts', 'Unit tests and restart check'), ('Photo path', 'PlantClassifierModule.kt', 'Build and limited device trial'), ('Online service', 'server/online-service.mjs', 'Server tests; deployment pending')]),
    (24, '4', 'System Architecture Overview', [
        'The architecture has three layers. The Android client is the only required runtime for offline use. It contains the React Native interface, local chat and feedback storage, the bundled knowledge pack, and native photo inference in test variants. An optional operator service handles general online questions. External sources and the hosted language model are contacted by that service; the app never contains the provider key [1, 3].',
        'A question first follows local classification and retrieval. This order matters: a known safety or regional question should not need a model call. A supported answer carries a title, message, and source list. An unsupported answer carries a clear refusal. If connectivity and policy allow, a second, visibly unreviewed message can add online research. Photo inference is independent from text answering and is always marked experimental.',
        'The selected region is an input to retrieval and any connected query. Chat history and photos are stored locally, while feedback is another local record. The system avoids a cloud account requirement for the pilot. This keeps first use simple but places responsibility for backup and export on the user and project team.'
    ], ('fig', 'Figure 4.1  WILD-AI context: Hiker → Android chat → local pack / local photo model; optional HTTPS service → web excerpts and hosted model.')),
    (25, '4', 'Client Components', [
        'The interface is implemented in App.tsx. It presents a conversation, single composer, attachment action, and a drawer containing the secondary actions. The screen keeps answer provenance visible as labels such as “Offline sources,” “Online · unreviewed,” and “Photo · experimental.” A restrained animated forest canopy and small luminous elements provide the requested nature theme while reduced-motion settings can disable movement [1].',
        'Domain logic is divided into modules: answerQuestion.ts performs local routing and retrieval; knowledgePack.ts holds bundled plant and field entries; regionPack.ts defines selections and emergency contacts; onlineKnowledge.ts handles linked encyclopedia summaries and saved notes; onlineModel.ts calls the operator service; chatHistory.ts and feedback.ts persist user records. This division lets data and safety decisions be tested without rendering the UI.',
        'The Android native classifier loads approved-format model assets, preprocesses a stored photo, produces a result and supports local copying of attachments. Its availability is checked by the UI. If no model exists in the build, the conversation says photo identification is unavailable and retains the image, instead of silently pretending to identify it.'
    ], [('Component', 'Responsibility'), ('React Native screen', 'Conversation, drawer, attachments, feedback'), ('Offline knowledge modules', 'Region-filtered sourced answers'), ('Native classifier', 'Local image inference where bundled'), ('App-private storage', 'Threads, images, notes and reports')]),
    (26, '4', 'Offline Answer Sequence', [
        'The offline sequence begins when a user sends a message. The client creates or resumes a thread and appends the user message before answering. The local answer function validates the region and normalizes the text. Emergency-contact phrases take a dedicated route. A found-plant edibility or toxicity question reaches a conservative abstention. Field topics and species records are then matched, with a source list when supported [2].',
        'A broad plant list query may return a subset of documented records or the full curated set when the wording asks to list all. The response states that the list is incomplete and cannot certify a specimen. A district query uses only matching area records unless the user chose the statewide view. The answer is appended to the active thread; storage saves the updated thread set asynchronously.',
        'This design offers deterministic responses that a reviewer can inspect. Its trade-off is limited linguistic coverage: a paraphrase may miss an entry. The next step is not necessarily a language model; a labelled question set can show where retrieval misses occur, after which synonyms or semantic ranking can be considered without weakening the safety-first route.'
    ], ('fig', 'Figure 4.2  Offline sequence: send → validate region and intent → retrieve fixed entry → attach source or abstain → append and save chat.')),
    (27, '4', 'Online Answer Sequence', [
        'When a general question has no adequate local answer and connectivity exists, the client can search Wikipedia and display linked summaries. If an operator service URL and pilot access code were configured before build, it can instead send the question, selected region, and bounded recent text history to that service. The service retrieves excerpts and asks NVIDIA’s hosted open-weight model to summarize those excerpts [1, 3].',
        'The service validates the bearer code, request size, region, history shape and length. It rejects safety-related wording before calling the provider. Its prompt treats conversation history as context and numbered excerpts as the only evidence. The response returns answer text, model identity and source links. The app displays a second message marked unreviewed, preserving the offline result even if the network route fails.',
        'The implemented service is ready for a small controlled deployment, but there is no live HTTPS host or provider key in the present build. The pilot code embedded in an APK is not a strong secret; it must be rotated and combined with quota monitoring. The one-process in-memory rate limit would need shared storage if the service were replicated.'
    ], ('fig', 'Figure 4.3  Connected sequence: Android → operator HTTPS service → encyclopedia excerpts → hosted model → labelled answer and links.')),
    (28, '4', 'Storage and Privacy Architecture', [
        'The application uses named AsyncStorage instances for chat, feedback and saved region notes. Conversations contain thread metadata, role-labelled messages, timestamps, source links and optional stored photo URI. An attachment is copied to app-private storage before it is committed to the conversation. The chat loading function validates the basic stored shape and reports an error if it cannot open saved history [1].',
        'This is a local-first design, not an end-to-end encrypted backup system. A person who uninstalls the application may lose app-private data unless it was exported by some separate device mechanism. Feedback remains local until the user explicitly shares JSON. Online search discloses the query and selected region to Wikimedia; the hosted model path discloses recent text to the operator and provider. A photograph is not uploaded by that path.',
        'Privacy review before distribution should confirm the Android manifest permissions, explain connected processing inside the UI, set retention and deletion expectations, and verify that crash logs do not inadvertently contain private questions. A future account or synchronization feature would require a new consent and security design rather than being assumed by this prototype.'
    ], None),
    (29, '4', 'Build and Deployment Architecture', [
        'The codebase uses React Native with Android native code for photo inference. A standalone arm64 pilot variant packages the JavaScript bundle and candidate model assets, so it can run without Metro. The current pilot APK is debug-key signed for direct test installation. A Play release requires a separate signing key, a release build, release-only asset selection, store information and policy review [1].',
        'The debug and pilot variants may include a candidate-only classifier. Release packaging requires model metadata with an approved status; the project has not met that gate. This build separation limits the chance of presenting experimental plant recognition as a validated public feature. The operator service can be deployed independently behind HTTPS, enabling its API key to remain on the server.',
        'A reproducible hand-off requires recording the model archive checksum, label order, content version, APK variant, test date and device. The model experiment record provides an archive checksum and evaluation summary, while the repository README records the build command and the known standalone APK path. A future CI pipeline should automate these records and prevent a pilot key or unreviewed model from entering a store release.'
    ], None),
    (30, '5', 'Content Curation Method', [
        'The offline pack began as a bounded source ledger rather than a scraped encyclopedia. Each plant record names a scientific taxon, a documented area, an occurrence source, and, for a limited subset, a separate food-use source. The content ledger explicitly warns that an occurrence record is not evidence for a particular trail and that food-use literature is not advice about a found specimen [4].',
        'The documented areas in the present roster are Corbett, Kalsi in Dehradun, Almora, and Pauri Garhwal. The app offers district selection across the state, but only these areas currently have corresponding plant records. Field topics are linked to meteorological guidance [9], park rules [10], and emergency contacts.',
        'The curation workflow should record the original URL, access date, exact proposition supported, geographic applicability, reviewer, review date, and content version. An expert should examine both the scientific name and any dangerous look-alike before a safety-related entry is approved. The current pack is source checked by the project, not signed off by an independent botanist or medical reviewer.'
    ], None),
    (31, '5', 'Plant Roster and Coverage', [
        'The pack contains twenty-five occurrence records. Corbett examples include sal, jamun, amla, sissoo and chir pine [11]; Almora records include kafal, hisalu, banj oak and buransh [12]; Pauri contributes deodar [13]; Kalsi in Dehradun contributes bael [14]. These records show the intended diversity of habitats, but their locations are broader than a route-level survey [4].',
        'Five records include documented fruit food-use sources: jamun, amla, bael, kafal and hisalu [15]. The application states only that fruit of a correctly identified species has documented use. It never claims that a photo, found fruit, or similar-looking plant is edible. For Corbett, the answer also reminds the user to remain on designated routes with a registered guide.',
        'A future pack should use a controlled taxonomic backbone, record synonyms explicitly, and distinguish native, planted, cultivated and merely reported occurrence. It should separate altitude and habitat bands where authoritative evidence supports them. All evidence must be evaluated for the actual pilot routes. Filling a statewide selector with a uniform state list would create false local precision.'
    ], [('Area', 'Examples in current ledger'), ('Corbett', 'Sal, jamun, amla, chir pine'), ('Kalsi / Dehradun', 'Bael'), ('Almora', 'Kafal, hisalu, banj oak, buransh'), ('Pauri Garhwal', 'Deodar')]),
    (32, '5', 'Region Selection and Offline Notes', [
        'The region selector lists Uttarakhand statewide and thirteen districts. It treats Mussoorie and Landour as part of Dehradun. The selected value is stored with a conversation and used to filter local records and select a local district control-room number. An unrepresented district does not inherit another district’s plant occurrence simply because both are in the same state [1, 2].',
        'Users may request a small supplemental download while online. The current implementation saves a short region article and up to three species summaries related to the selected area from Wikipedia. The notes are stored under the selected region and can later be retrieved for a related general question. They are unreviewed, text-only content; they do not include offline map tiles, trail navigation, live weather or emergency updates.',
        'The download experience should show when notes were saved and whether they are present. Future region packs could carry versioned, independently reviewed content with incremental updates, size estimates and verified coverage manifests. Until then, the app should call this feature “notes” and avoid implying it offers full Google Maps-style offline regions.'
    ], None),
    (33, '5', 'Retrieval and Answer Construction', [
        'Local retrieval begins by normalizing case, punctuation and spaces. Rules recognize emergency contact questions, found-plant safety wording, toxicity and medical topics, field-guide terms, exact common or scientific names, and broad plant-list queries. Responses are assembled from fixed strings and source objects. This is deliberately simpler than vector search because the pack is small and the wording can be inspected line by line [2].',
        'For a named species, the answer identifies the documented area and whether the pack contains a food-use source. For a list request, it collects records matching the selected area and optionally filters to the food-use subset. The output declares that the list is curated and incomplete. A query with no supported route yields a specific “no reviewed answer” message rather than hallucinated advice.',
        'A lexical method may not recognize every synonym or spelling variation. A test set should include local names, scientific names, paraphrases, contradictory phrasing and out-of-scope questions. The key measures are supported-answer precision, missed relevant answers, unsafe overreach, source correctness and appropriate abstention. A semantic index would be justified only if it improves these measures under the same guardrails.'
    ], None),
    (34, '5', 'Safety Abstention Policy', [
        'WILD-AI is intentionally conservative. The local answer path rejects questions that ask whether a found or photographed plant is safe to eat, and it abstains on toxicity, poisoning, medicine and treatment requests. The online client and service also prevent safety topics from being sent for generative summarization. An image suggestion states that it must never be used for edibility, toxicity or treatment decisions [1, 2, 3].',
        'Abstention is a functional response, not an error. It tells the user what the system cannot establish and, where relevant, suggests a qualified local expert or emergency assistance. However, a simple word filter is not a complete safety classifier. Indirect phrasing, misspellings, another language, or a follow-up such as “what about this one?” can bypass keyword checks. A release needs a representative adversarial evaluation and a reviewed interaction policy.',
        'The interface must not bury the caveat beneath a confident botanical name. In field testing, reviewers should observe whether participants actually understand the distinction between “documented species,” “possible photo match,” and “safe specimen.” Harmful misunderstandings should be treated as product failures even if the underlying source or model computation was technically correct.'
    ], None),
    (35, '5', 'Source Governance and Updating', [
        'The source ledger lists the current occurrence, food-use, field-topic and contact references [4]. Government and research sources can still be broad, incomplete or out of date for a local trail. A link alone does not validate every sentence the application displays. Each displayed claim should be traceable to a precise passage and checked for the relevant district or park rules.',
        'The current emergency contacts were checked against the Uttarakhand State Disaster Management Authority pages on 25 October 2026. They include statewide numbers and district control rooms, shown only when a corresponding district is selected [1, 4]. These numbers should be reverified immediately before any field pilot, and the app should tell users that a phone call requires cellular coverage.',
        'A practical content update workflow is: propose a source change; record the old and new claim; obtain domain review; update the pack and source ledger; run question tests; build a new signed release; and publish a version note. Old downloaded unreviewed notes should carry a retrieval date and should never silently become “reviewed” because an online article changed.'
    ], None),
    (36, '6', 'Photo Dataset Plan', [
        'The model dataset contract defines a ZIP with a manifest of image path, scientific label, observation identifier, train/validation/test split, source URL, license and verified region. The planned full scope is twenty to thirty known species plus unknown plants and dangerous look-alikes. All photographs from the same observation must stay within one split, while photographers, routes, dates and devices should also be held out where practical [6].',
        'The project collected an initial gallery of 475 candidate photographs, which the owner visually reviewed. The experimental run used a subset of known-class images, an out-of-scope set, and additional photos fetched from iNaturalist for training [16]. Owner approval of the visible gallery is not independent expert confirmation of taxonomy, location or licensing for all later additions. The experiment record preserves that distinction [5, 6].',
        'A release dataset needs a curation log with taxonomic review, permission for the intended use, actual geographic origin, image quality checks, near-duplicate search, and labels for plant part and life stage when useful. An independent Uttarakhand field set should be gathered after model development and kept untouched until final evaluation.'
    ], None),
    (37, '6', 'Remote Training and Export', [
        'Training is intended to occur in the owner’s Google Colab environment. The Android device performs inference only. The notebook and dataset contract define a route for preparing a candidate model, labels and an evaluation record. This separation keeps training workloads away from a mid-range phone and makes model archives inspectable before they are copied into Android assets [6].',
        'The experiments explored a MobileNetV2 TFLite route and plant-pretrained encoders with support vector machines. The stronger candidate uses an OpenPlants Vision Transformer encoder exported to quantized ONNX with reference embeddings and an SVM; a compact PlantNet MobileNetV3 route was also exported. The stronger archive is roughly 69 MB compressed and its encoder is roughly 89 MB. Its reported checksum is recorded in the experiment log [5].',
        'An archive must contain the exact label order, preprocessing specification, threshold or novelty gate, source model license, and evaluation JSON. A class-order mismatch can produce a plausible but incorrect species name despite correct inference. Build scripts therefore distinguish candidate-only assets from an approved release model. No current candidate has passed the release gate.'
    ], None),
    (38, '6', 'Experimental Evaluation', [
        'On the original held-out set, the quantized stronger ONNX candidate correctly accepted 45 of 60 known photographs and falsely accepted 1 of 30 out-of-scope photographs. The compact candidate correctly accepted 37 of 60 known photographs and accepted 0 of 30 in that small out-of-scope set. These figures are research results from a limited split, not field accuracy. The report records counts to avoid hiding the sample size behind percentages [5].',
        'A later stress set with twenty species not used for model selection changed the picture: the exported stronger gate accepted 25 of 100 unknown photographs as known, while the compact gate accepted 11 of 100. This exposes a substantial open-set risk. A stricter exploratory gate lowered unknown acceptance at the cost of many more rejected known plants, and was not part of the exported archive.',
        'The class-level results are also uneven. The compact candidate performed especially poorly on bael and deodar in the recorded test. Before field use, the team must evaluate each class on independent local images, report wrong-species suggestions and abstentions, inspect dangerous look-alikes, and measure the full device pipeline rather than model tensors alone.'
    ], [('Candidate', 'Known correct', 'Unknown accepted (original test)', 'Unknown accepted (extra 100)'), ('Strong ONNX', '45 / 60', '1 / 30', '25 / 100'), ('Compact ONNX', '37 / 60', '0 / 30', '11 / 100')]),
    (39, '6', 'Android Photo Inference', [
        'The pilot native module accepts a persisted photo URI, decodes and preprocesses an image, loads the candidate encoder and classifier assets, applies the configured threshold, and returns a scientific label or null. The React Native interface maps null to “No reliable match” and presents any positive label as a possible match. It adds a warning against edibility, toxicity and treatment use [1, 5].',
        'The bundled model is only available in the pilot and debug variants. A standard release requires model metadata marked approved. The standalone pilot build packages the JavaScript bundle and model assets so it does not depend on a running development server. It was installed and launched on a Samsung SM-S911B in a prior device check. That check showed that the app started and retained a conversation; it did not establish classifier accuracy in the field.',
        'The next measurement should cover photo acquisition, image orientation, runtime initialization, repeated inferences, peak memory, latency, battery and thermal effects. Users may photograph leaves, flowers, bark or an entire canopy at different distances; the test plan must include these variations and non-plant inputs. A positive result must remain a tentative suggestion even after performance improves.'
    ], None),
    (40, '6', 'Model Failure Analysis and Release Gate', [
        'A model can fail because the photographed plant is absent from training, the image shows an unfamiliar plant part, background dominates the frame, lighting or camera processing differs, a class has too few examples, or a near-duplicate test split makes measured accuracy too optimistic. The stress test in this project showed that a small unknown set substantially understated false acceptance on additional species [5].',
        'The release gate requires independent botanical review of labels, known look-alikes, license and geographic scope; a frozen field-photo test set; per-class results; an open-set test; and thresholds chosen without peeking at the final test set. Evaluation must state the rate of wrong accepted names, unknown accepted names, correct accepted names, and abstentions. The consequences of an error are asymmetric: a wrong confident suggestion is more serious than a safe refusal.',
        'No numerical threshold alone can certify a plant as edible or harmless. The approved product wording should state the supported classes, what image types were tested, and that a possible match is informational. If the gate cannot be met by the planned pilot date, the pilot can still study chat usability with the photo route clearly disabled or labelled research-only under supervision.'
    ], None),
    (41, '7', 'Interface Design Principles', [
        'The interface was simplified to a single interactive chat input, a conversation timeline, and a drawer for region, saved conversations, downloads, contacts and feedback. This reduces the number of decisions on the primary screen. A user can type a question or attach a camera or gallery image in the same flow. A saved thread keeps its region and previous turns [1].',
        'The forest-inspired visual treatment uses a dark canopy palette and small animated luminous particles rather than a full photographic background. This keeps the content legible and expresses the intended living-ecosystem feel without competing with the answer. Motion responds to Android’s reduced-motion setting. The keyboard avoidance behaviour was adjusted and checked on the connected Samsung phone so the composer remains above the soft keyboard.',
        'The next five pages reserve figure boxes for screenshots of the actual application. Insert images from the final build after capture. Each image should show the complete screen, include no private participant data, and be referred to by its numbered caption. The boxes are intentionally empty at report creation.'
    ], None),
    (42, '7', 'Chat Home Screen', [
        'Figure 7.1 is reserved for the main conversation screen. It should show the header, the empty or active chat state, source labels, and the single composer. Capture a clean state from the final APK on the target device. The chat view should make it possible to distinguish a user question, a reviewed offline response, and a notice without reading technical implementation details.',
        'The design intent is for the interface to remain calm and usable outdoors: the input is prominent, long answers can scroll, and secondary actions are removed from the center of the screen. A screenshot is useful here because it will let the reviewer inspect information density, contrast, touch targets and the visual theme directly.'
    ], ('shot', 'Figure 7.1  Main chat screen — insert application screenshot here.')),
    (43, '7', 'Region and Navigation Drawer', [
        'Figure 7.2 is reserved for the drawer and region selection. It should show where a user changes area, revisits conversations, opens saved notes, finds contacts, and reviews feedback. The screenshot should use the final wording and show the selected district clearly.',
        'Region choice is a critical context setting. If the user selects Dehradun, the application may display Dehradun-specific records and local control-room contacts where known; it must not imply that all Uttarakhand species have been verified on a Mussoorie trail. The visible selection supports that distinction and helps a reviewer assess whether the current geographic scope is understandable.'
    ], ('shot', 'Figure 7.2  Drawer and region choice — insert application screenshot here.')),
    (44, '7', 'Photo Attachment and Result', [
        'Figure 7.3 is reserved for a chat with a photo attachment and a classifier result. It should show the photo preview, the “possible match” or unknown wording, and the experimental provenance label. Use a consented test image, not an unreviewed participant photograph.',
        'The result should communicate model uncertainty before the user acts on it. A photograph can be saved in the conversation even if the model is absent or fails. The screenshot should therefore be chosen to demonstrate either a clear abstention or the cautious wording of a tentative suggestion, including the statement that recognition is not an edibility, toxicity or treatment decision.'
    ], ('shot', 'Figure 7.3  Photo question and experimental result — insert application screenshot here.')),
    (45, '7', 'Feedback and Saved History', [
        'Figure 7.4 is reserved for feedback on a missing or incorrect answer, while Figure 7.5 may be placed in the same box if space permits to show a resumed conversation. The reviewer should be able to see that the user can record a note tied to a question and answer. The feedback screen stores the report locally; sharing JSON is a later explicit action.',
        'This interface is important for the pilot because incorrect answers, missing coverage, confusing labels and photo errors are expected findings. Feedback must preserve enough context to reproduce a case without uploading private material automatically. A screenshot can also help verify that reporting a problem does not interrupt the conversation flow.'
    ], ('shot', 'Figures 7.4–7.5  Feedback and saved chat — insert application screenshots here.')),
    (46, '7', 'Downloaded Notes and Emergency Contacts', [
        'Figure 7.6 is reserved for downloaded notes or emergency contacts in the drawer. The image should distinguish bundled, source-checked content from saved encyclopedia notes. A download date and region label help the user interpret a note when travelling offline.',
        'The emergency contact view should make the state and district numbers readable, along with the reminder that a call requires cellular service. This screenshot is a design and content review aid; it does not replace rechecking the contact numbers against their official source immediately before the field pilot.'
    ], ('shot', 'Figure 7.6  Saved notes or emergency contacts — insert application screenshot here.')),
    (47, '8', 'Verification and Current Results', [
        'The repository includes unit tests for offline questions, chat history, feedback, online knowledge, online model integration, and the Node service. On 28 October 2026, all five Jest suites (ten tests), the service test, TypeScript validation and ESLint passed. The standalone Android pilot APK was built and installed on a Samsung SM-S911B; with Metro stopped, it opened, saved a local answer and photo result, and retained them after a force-stop and restart [1].',
        'A later keyboard-layout fix changed the Android chat container to use keyboard avoidance. A rebuilt pilot APK was installed, the Samsung keyboard was opened, and the composer was visually confirmed above it. These are meaningful implementation checks, but they cover one device and keyboard configuration. No broad Android matrix, accessibility audit, battery run, cold offline field trial, or independent plant-photo test has been completed.',
        'The present outcome is therefore a functioning prototype with explicit release blockers. Expert review of safety content, local field validation of the classifier, audit of online answer faithfulness, refreshed contacts, and a supervised five-to-ten-user pilot are necessary before broader distribution.'
    ], [('Check', 'Evidence', 'Limit'), ('Static and unit checks', 'Reported passing in repository history', 'No field behaviour'), ('Standalone install', 'Samsung SM-S911B', 'One device'), ('Model research set', 'Recorded counts in Chapter 6', 'Not independent field validation')]),
]

assert len(PAGES) == 39 and [p[0] for p in PAGES] == list(range(9, 48))

def shade(cell, color='EDF3F0'):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), color)
    tc_pr.append(shd)

def set_cell_border(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for side in ('top', 'left', 'bottom', 'right'):
        edge = OxmlElement(f'w:{side}')
        edge.set(qn('w:val'), 'single')
        edge.set(qn('w:sz'), '5')
        edge.set(qn('w:color'), 'A9B7AF')
        borders.append(edge)
    tc_pr.append(borders)

def page_break(doc):
    doc.add_page_break()

def title(doc, text, level=1):
    p = doc.add_paragraph(text, style=f'Heading {level}')
    p.paragraph_format.keep_with_next = True
    return p

def para(doc, text, after=Pt(8)):
    p = doc.add_paragraph(text)
    p.paragraph_format.space_after = after
    return p

def table(doc, rows, caption):
    para(doc, caption, Pt(4)).style = 'Caption'
    t = doc.add_table(rows=0, cols=len(rows[0]))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    widths = [Cm(4.0), Cm(5.3), Cm(5.3), Cm(2.5)][:len(rows[0])]
    if len(rows[0]) == 2:
        widths = [Cm(4.4), Cm(8.7)]
    elif len(rows[0]) == 3:
        widths = [Cm(3.6), Cm(4.7), Cm(4.8)]
    elif len(rows[0]) == 4:
        widths = [Cm(3.0), Cm(3.2), Cm(3.4), Cm(3.5)]
    for ridx, data in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(data):
            cells[i].width = widths[i]
            cells[i].text = value
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_border(cells[i])
            if ridx == 0:
                shade(cells[i], 'DCE9E1')
                for run in cells[i].paragraphs[0].runs: run.bold = True
    return t

def screenshot_slot(doc, caption):
    t = doc.add_table(rows=1, cols=1)
    t.rows[0].height = Cm(12.5)
    t.rows[0].height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
    cell = t.cell(0, 0)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_border(cell)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('APPLICATION SCREENSHOT SPACE\n\nPaste final captured screen here')
    run.font.color.rgb = RGBColor(130, 145, 137)
    run.font.size = Pt(12)
    para(doc, caption, Pt(0)).style = 'Caption'

def page_header(doc, chapter, text, first):
    title(doc, f'CHAPTER {chapter}: {text}' if first else text)

FIGURES = {
    24: '''digraph G { graph [rankdir=LR, bgcolor="white", margin=0.15, nodesep=0.28, ranksep=0.34]; node [shape=box, style="rounded,filled", fillcolor="#E8F3EC", color="#315E49", fontname="Times New Roman", fontsize=12]; edge [color="#315E49"]; User [label="Hiker / trekker"]; App [label="Android chat app"]; Pack [label="Offline knowledge pack"]; Photo [label="Local photo model\n(pilot only)"]; Service [label="Optional HTTPS service"]; User -> App; App -> Pack; App -> Photo; App -> Service; }''',
    26: '''digraph G { graph [rankdir=TB, bgcolor="white", margin=0.15, nodesep=0.30, ranksep=0.34]; node [shape=box, style="rounded,filled", fillcolor="#E8F3EC", color="#315E49", fontname="Times New Roman", fontsize=14]; edge [color="#315E49"]; Q [label="Question + selected region"]; Gate [label="Safety and contact rules"]; Search [label="Local record match"]; Answer [label="Sourced answer or abstention"]; Save [label="Append and save chat"]; Q -> Gate -> Search -> Answer -> Save; }''',
    27: '''digraph G { graph [rankdir=TB, bgcolor="white", margin=0.15, nodesep=0.30, ranksep=0.34]; node [shape=box, style="rounded,filled", fillcolor="#E8F3EC", color="#315E49", fontname="Times New Roman", fontsize=14]; edge [color="#315E49"]; App [label="Allowed general question"]; Service [label="Operator HTTPS service"]; Source [label="Retrieved web excerpts"]; Model [label="Hosted open-weight model"]; Return [label="Unreviewed answer + source links"]; App -> Service -> Source -> Model -> Return; }''',
}
FIGURE_DIR = OUT.parent / 'figures'
FIGURE_DIR.mkdir(parents=True, exist_ok=True)
for page, dot in FIGURES.items():
    subprocess.run(['dot', '-Tpng', '-o', str(FIGURE_DIR / f'figure_{page}.png')], input=dot, text=True, check=True)

def title_page(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Cm(1.8)
    r = p.add_run('WILD-AI\nOFFLINE AND CONNECTED FIELD ASSISTANT\nFOR UTTARAKHAND')
    r.bold = True; r.font.name = 'Times New Roman'; r.font.size = Pt(24)
    for text in ('PROJECT REPORT', 'Submitted in partial fulfilment of the requirements for the degree of', 'Master of Computer Applications\n[Specialization / Major to be filled]', 'Submitted by\n[Student name and roll number]', 'Under the supervision of\n[Faculty advisor name and designation]', 'DIT University\nOctober 2026'):
        p = doc.add_paragraph(text)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Cm(0.7)

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin, sec.bottom_margin, sec.left_margin, sec.right_margin = Cm(4), Cm(4), Cm(4), Cm(4)
sec.header_distance, sec.footer_distance = Cm(1.3), Cm(1.3)

styles = doc.styles
normal = styles['Normal']
normal.font.name = 'Times New Roman'
normal.font.size = Pt(12)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_after = Pt(8)
for name, size in [('Heading 1', 16), ('Heading 2', 13)]:
    s = styles[name]
    s.font.name = 'Times New Roman'
    s.font.size = Pt(size)
    s.font.bold = True
    s.font.color.rgb = RGBColor(0, 0, 0)
    s.paragraph_format.space_before = Pt(0)
    s.paragraph_format.space_after = Pt(12)
    s.paragraph_format.keep_with_next = True
cap = styles['Caption']
cap.font.name = 'Times New Roman'
cap.font.size = Pt(10)
cap.font.italic = True
cap.font.color.rgb = RGBColor(0, 0, 0)
cap.paragraph_format.line_spacing = 1.0
cap.paragraph_format.space_after = Pt(6)

# The supplied format calls for an outer cover repeated as the inner title page.
title_page(doc)
inner = doc.add_section(WD_SECTION.NEW_PAGE)
inner.page_width, inner.page_height = Cm(21), Cm(29.7)
inner.top_margin, inner.bottom_margin, inner.left_margin, inner.right_margin = Cm(3), Cm(3), Cm(4), Cm(2)
inner.header_distance, inner.footer_distance = Cm(1.3), Cm(1.3)
inner.footer.is_linked_to_previous = False
footer = inner.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
field = OxmlElement('w:fldSimple')
field.set(qn('w:instr'), 'PAGE')
footer._p.append(field)

# Front matter: intentionally unsigned, with student details left for the owner.
title_page(doc)
page_break(doc)

title(doc, 'DECLARATION')
para(doc, 'I declare that this written submission represents my project work in my own words and that I have cited and referenced ideas, data, software, or words from other sources. I declare that I have followed the principles of academic honesty and integrity and have not misrepresented or fabricated any idea, data, fact, source, implementation, experiment, or result in this submission. I understand that a violation may lead to action under the University’s rules.')
para(doc, 'Plagiarism check report: [Attach the required report before submission.]')
para(doc, 'Student name: __________________________________________')
para(doc, 'Roll number: ____________________________________________')
para(doc, 'Signature: ___________________   Date: ___________________')
para(doc, 'Supervisor name and approval: ___________________________')
page_break(doc)

title(doc, 'ACKNOWLEDGEMENTS')
para(doc, 'I acknowledge the guidance of [faculty advisor name], the support of DIT University, and the assistance of project reviewers and pilot participants who will help evaluate WILD-AI. This statement should be edited by the student to reflect only contributions that actually occurred.')
para(doc, 'The current project record includes an owner-reviewed candidate image gallery, public source material listed in the source ledger, and experiments run in the owner’s Google Colab environment. The report separates these contributions from independent expert verification, which is still pending. No contributor is represented as having approved medical, botanical, or field-safety guidance unless that approval is later documented.')
para(doc, 'The project also benefited from public documentation and open-source tooling for React Native, Android, iNaturalist image sourcing, Wikipedia information retrieval, TensorFlow/LiteRT, ONNX inference and hosted model prototyping. The corresponding repository artefacts and cited sources are listed in the references.')
page_break(doc)

title(doc, 'ABSTRACT')
para(doc, 'WILD-AI is an Android field-assistant prototype for hikers and trekkers in Uttarakhand. It provides a focused chat interface, selectable geographic context, a small source-linked offline knowledge pack, saved conversations and photographs, local feedback, downloadable unreviewed region notes, and optional connected answers. Its experimental plant photo model is available only in test variants and may abstain. The app is designed to distinguish reviewed local records from unreviewed online summaries and tentative image predictions.')
para(doc, 'The offline pack currently contains twenty-five documented plant occurrence records, five limited fruit food-use records, selected field topics and emergency contacts. The question route matches region, topic and species wording and assembles fixed answers with sources. Safety questions about found plants, toxicity or treatment are refused rather than inferred. An optional operator-hosted service retrieves excerpts and requests a source-grounded answer from an open-weight model; the provider key remains server-side.')
para(doc, 'A research photo model was trained remotely and integrated into a standalone Android pilot APK. On an original held-out test, the stronger candidate correctly accepted 45 of 60 known images but accepted 25 of 100 images from a later disjoint-species stress set. These results do not justify field identification claims. A standalone APK and basic persistence have been verified on one Samsung phone, while expert content review and independent field evaluation remain open. The report concludes with a practical release-gate and pilot plan.')
para(doc, 'Keywords: offline-first, Android, React Native, field guide, plant recognition, retrieval, uncertainty, Uttarakhand.')
page_break(doc)

title(doc, 'TABLE OF CONTENTS — PART I')
toc1 = [
('Declaration',3),('Acknowledgements',4),('Abstract',5),('Lists of Tables, Figures and Abbreviations',8),
('Chapter 1: Introduction',9),('Problem statement',10),('Objectives and expected outcomes',11),('Scope and boundaries',12),('Stakeholders and scenarios',13),
('Chapter 2: Related Work',14),('Image classification',15),('Retrieval-augmented answers',16),('Connected assistance',17),('Research gap',18),
('Chapter 3: Requirements',19),('Non-functional requirements',20),('Constraints and risks',21),('Use cases',22),('Traceability',23),
('Chapter 4: Architecture',24),('Client components',25),('Offline and online flows',26),('Storage and deployment',28),
]
for name, n in toc1: para(doc, f'{name}  —  {n}', Pt(2))
page_break(doc)

title(doc, 'TABLE OF CONTENTS — PART II')
toc2 = [
('Chapter 5: Content and Retrieval',30),('Content curation',30),('Plant roster',31),('Regions and notes',32),('Retrieval and safety policy',33),('Source governance',35),
('Chapter 6: Photo Model',36),('Dataset and training',36),('Experimental evaluation',38),('Android inference',39),('Failure analysis',40),
('Chapter 7: Interface Design',41),('Chat and screenshot placeholders',42),('Drawer and region',43),('Photo result',44),('Feedback and history',45),('Notes and contacts',46),
('Chapter 8: Verification and Results',47),('Chapter 9: Conclusions and Future Work',48),('References',49),
]
for name, n in toc2: para(doc, f'{name}  —  {n}', Pt(3))
page_break(doc)

title(doc, 'LIST OF TABLES')
for line in [
    'Table 1.1  Objectives and prototype evidence — 11',
    'Table 3.1  Functional requirements — 19',
    'Table 3.2  Risks and controls — 21',
    'Table 3.3  Requirement traceability — 23',
    'Table 4.1  Client components — 25',
    'Table 5.1  Selected roster coverage — 31',
    'Table 6.1  Candidate model research results — 38',
    'Table 8.1  Verification status — 47',
]: para(doc, line, Pt(0))

title(doc, 'LIST OF FIGURES', 2)
for line in [
    'Figure 4.1  System context — 24', 'Figure 4.2  Offline answer sequence — 26', 'Figure 4.3  Connected answer sequence — 27',
    'Figure 7.1  Main chat screen (reserved) — 42', 'Figure 7.2  Drawer and region (reserved) — 43',
    'Figure 7.3  Photo result (reserved) — 44', 'Figures 7.4–7.5  Feedback and saved chat (reserved) — 45',
    'Figure 7.6  Notes or contacts (reserved) — 46',
]: para(doc, line, Pt(0))
title(doc, 'Abbreviations', 2)
for line in ['APK — Android Package Kit', 'API — Application Programming Interface', 'ONNX — Open Neural Network Exchange', 'RAG — Retrieval-Augmented Generation', 'SVM — Support Vector Machine', 'TFLite — TensorFlow Lite', 'UI — User Interface']:
    para(doc, line, Pt(0))
page_break(doc)

table_numbers = {11:'1.1',19:'3.1',21:'3.2',23:'3.3',25:'4.1',31:'5.1',38:'6.1',47:'8.1'}
for num, chapter, heading, paragraphs, extra in PAGES:
    assert num == 9 if heading == 'Introduction: Project Context' else True
    page_header(doc, chapter, heading, num in (9, 14, 19, 24, 30, 36, 41, 47))
    for text in paragraphs:
        para(doc, text)
    if extra:
        if isinstance(extra, list):
            table(doc, extra, f'Table {table_numbers[num]}  {heading.lower()}')
        elif extra[0] == 'shot':
            screenshot_slot(doc, extra[1])
        else:
            pic = doc.add_paragraph()
            pic.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pic.add_run().add_picture(str(FIGURE_DIR / f'figure_{num}.png'), width=Cm(6.2 if num in (26, 27) else 12.7))
            para(doc, extra[1], Pt(0)).style = 'Caption'
    page_break(doc)

title(doc, 'CHAPTER 9: SUMMARY, CONCLUSIONS AND FUTURE WORK')
para(doc, 'WILD-AI has reached the stage of a working offline-first Android prototype. It combines a focused conversation screen, local source-backed answers, district selection, local history and photographs, feedback, short saved notes, optional online enrichment, and a research photo model in test builds. The application uses provenance labels and abstention to make uncertainty visible. A standalone pilot APK has been built and launched on one Android phone [1].')
para(doc, 'The strongest conclusion is a boundary: technical integration does not establish field safety. The offline content still needs qualified review; the image model has a material false-accept problem on additional unknown species; online model answers are unreviewed; and the current test evidence is narrower than a real hiking deployment. The system should not be described as identifying safe edible plants or replacing emergency professionals.')
para(doc, 'Future work is ordered by risk. First, confirm the content and contacts with local domain experts, curate an independent Uttarakhand photo set, and choose a gate that reports harmful accepted errors as well as abstention. Second, run the app offline on representative mid-range phones and measure startup, camera flow, inference latency, memory, thermal behaviour and battery. Third, deploy the online service behind HTTPS with operator controls and evaluate its source faithfulness. Finally, run a supervised five-to-ten-user pilot, review saved feedback, and only then consider a Google Play closed release. Richer semantic retrieval, larger region packs, on-device text models and more languages are later options, not prerequisites for validating the current prototype.')
page_break(doc)

title(doc, 'REFERENCES')
refs = [
    '[1] WILD-AI project repository, README.md and ARCHITECTURE.md, local project records, accessed 27 Oct. 2026.',
    '[2] WILD-AI project repository, src/answerQuestion.ts, src/knowledgePack.ts, src/regionPack.ts, src/chatHistory.ts and src/onlineKnowledge.ts, source code, accessed 27 Oct. 2026.',
    '[3] WILD-AI project repository, server/online-service.mjs, source code, accessed 27 Oct. 2026.',
    '[4] WILD-AI project repository, CONTENT_SOURCES.md, source ledger checked 25 Oct. 2026.',
    '[5] WILD-AI project repository, training/MODEL_EXPERIMENT_2026-10-25.md, experiment record dated 25 Oct. 2026.',
    '[6] WILD-AI project repository, training/DATASET.md and training/WILD_AI_Colab.ipynb, data contract and notebook, accessed 27 Oct. 2026.',
    '[7] NVIDIA, NIM LLM API reference and prototype service documentation, https://docs.api.nvidia.com/nim/reference/llm-apis, cited in the repository README.',
    '[8] Uttarakhand State Disaster Management Authority, official website and district EOC contact list, https://usdma.uk.gov.in/ and https://usdma.uk.gov.in/eocs-contact/, checked in the project on 25 Oct. 2026.',
    '[9] India Meteorological Department, field precaution documents and URLs in CONTENT_SOURCES.md.',
    '[10] Corbett Tiger Reserve, visitor rules, https://corbettgov.org/terms, cited in the project source ledger.',
    '[11] National Tiger Conservation Authority, Corbett habitat account within the All India Tiger Estimation report, https://ntca.gov.in/assets/uploads/Reports/AITM/AITE_2014_fullreport.pdf, cited in the project source ledger.',
]
for ref in refs: para(doc, ref, Pt(4))
page_break(doc)

title(doc, 'REFERENCES (CONTINUED)')
refs2 = [
    '[12] Almora District Administration, Flora and Fauna, https://almora.nic.in/flora-and-fauna/, cited in the project source ledger.',
    '[13] Pauri Garhwal District Administration, Forest, https://pauri.nic.in/forest/, cited in the project source ledger.',
    '[14] Forest Research Institute, Uttarakhand forest genetic resources survey, URL recorded in CONTENT_SOURCES.md.',
    '[15] Indian Council of Agricultural Research; National Horticulture Board; Indian Council of Forestry Research and Education; Botanical Survey of India, food-use records and URLs in CONTENT_SOURCES.md.',
    '[16] iNaturalist, API recommended practices, https://www.inaturalist.org/pages/api+recommended+practices, cited in the dataset collection record.',
]
for ref in refs2: para(doc, ref, Pt(4))

doc.core_properties.title = 'WILD-AI Project Report'
doc.core_properties.subject = 'Offline and connected Android field assistant for Uttarakhand'
doc.core_properties.keywords = 'WILD-AI; Uttarakhand; Android; project report'
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT)
print(OUT)
