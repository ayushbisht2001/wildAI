const pptxgen = require('pptxgenjs');
const path = require('path');
const { applyTheme } = require('/home/ayush/.agents/skills/synced/e1a3b30d-210b-4965-8443-8d7d9af9a782_0d4bd7af-0945-448b-bb83-e0d0e709b7a3/pptx/scripts/apply_theme.js');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'WILD-AI project';
pptx.subject = 'Eight-slide project presentation for WILD-AI';
pptx.title = 'WILD-AI — Offline field companion';
pptx.company = 'WILD-AI';
pptx.lang = 'en-IN';

const W = 13.333, H = 7.5;
const C = {
  night: '07171E', deep: '0B222B', surface: '102832', raised: '173640',
  line: '31545A', text: 'EDFFF6', muted: 'A9C1BF', mint: 'A2F4D0',
  mint2: '67DDB2', teal: '1B756C', amber: 'F4DBA0', violet: 'AAB8EF',
};
const S = pptx.ShapeType;
const theme = {
  name: 'WILD-AI Forest Glow',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: C.night, lt1: C.text, dk2: C.deep, lt2: 'DAF3E8',
    accent1: C.mint, accent2: C.teal, accent3: C.amber,
    accent4: C.violet, accent5: C.mint2, accent6: C.line,
    hlink: C.mint2, folHlink: C.violet,
  },
};
pptx.theme = { headFontFace: theme.headFontFace, bodyFontFace: theme.bodyFontFace, lang: 'en-IN' };
pptx.defineSlideMaster({
  title: 'FOREST',
  background: { color: C.night },
  objects: [],
  slideNumber: { x: 12.32, y: 7.10, w: 0.34, h: 0.16, color: C.muted, fontFace: 'Calibri', fontSize: 9, align: 'right', margin: 0 },
});

function txt(slide, text, x, y, w, h, opts={}) {
  slide.addText(text, {
    x, y, w, h, margin: 0, breakLine: false, isTextBox: true,
    fontFace: opts.fontFace || 'Calibri',
    fontSize: opts.fontSize || 20,
    color: opts.color || C.text,
    bold: opts.bold || false,
    align: opts.align || 'left',
    valign: opts.valign || 'mid',
    fit: 'shrink',
    ...opts,
  });
}
function shape(slide, type, x, y, w, h, fill, line='none', radius) {
  slide.addShape(type, {
    x, y, w, h,
    rectRadius: radius,
    fill: typeof fill === 'string' ? { color: fill } : fill,
    line: line === 'none' ? { color: fill.color || fill, transparency: 100 } : { color: line, width: 1 },
  });
}
function dot(slide, x, y, r, color=C.mint, opacity=0) {
  shape(slide, S.ellipse, x, y, r, r, { color, transparency: opacity });
}
function fireflies(slide, variant=0) {
  const points = variant % 2
    ? [[0.34,1.31,.09],[12.51,1.45,.13],[11.87,6.54,.06],[0.54,5.62,.06],[12.75,3.92,.08]]
    : [[0.42,1.80,.08],[12.47,1.03,.12],[11.95,6.29,.08],[0.88,6.58,.05],[12.66,4.55,.07]];
  points.forEach(([x,y,r],i) => {
    dot(slide,x-r/2,y-r/2,r*4,i%3===0?C.amber:C.mint,90);
    dot(slide,x,y,r,i%3===0?C.amber:C.mint,i%2?10:35);
  });
}
function base(section, n) {
  const slide = pptx.addSlide({ masterName: 'FOREST', sectionTitle: section });
  fireflies(slide,n);
  txt(slide,'WILD.AI',0.62,0.24,1.7,0.24,{fontSize:12,bold:true,color:C.mint,charSpacing:2});
  txt(slide,section.toUpperCase(),10.14,0.25,2.39,0.19,{fontSize:9.5,bold:true,color:C.muted,align:'right',charSpacing:1.5});
  return slide;
}
function headline(slide, title, sub) {
  txt(slide,title,0.72,0.83,11.6,0.74,{fontFace:'Cambria',fontSize:36,bold:true});
  if(sub) txt(slide,sub,0.76,1.58,11.25,0.4,{fontSize:17,color:C.muted});
}
function rounded(slide,x,y,w,h,fill=C.surface) {
  shape(slide,S.roundRect,x,y,w,h,{color:fill},C.line,0.22);
}
function numberTag(slide,n,x,y,color=C.mint) {
  dot(slide,x,y,0.40,color,82);
  txt(slide,String(n).padStart(2,'0'),x,y+0.055,0.40,0.28,{fontSize:14,bold:true,color,align:'center'});
}

// 1. Cover: app-native canopy geometry, not a photograph.
pptx.addSection({ title: 'Opening' });
{
  const slide = base('Opening',1);
  shape(slide,S.ellipse,8.82,-1.75,6.05,6.05,{color:C.teal,transparency:70});
  shape(slide,S.ellipse,9.87,-0.61,4.05,4.05,{color:C.mint2,transparency:88});
  shape(slide,S.ellipse,8.88,3.48,5.9,4.55,{color:C.deep,transparency:5});
  shape(slide,S.ellipse,9.7,3.32,4.15,2.6,{color:C.raised,transparency:17});
  [[9.7,1.7,.12],[10.5,2.2,.09],[11.4,1.5,.13],[12.1,2.8,.08],[9.9,4.4,.11],[12.3,4.0,.07],[11.6,5.2,.10]].forEach(([x,y,r],i)=>dot(slide,x,y,r,i%3===0?C.amber:C.mint,i%2?12:30));
  txt(slide,'A field companion\nfor the moments\nthat matter.',0.77,1.48,8.3,2.55,{fontFace:'Cambria',fontSize:42,bold:true,breakLine:false,valign:'top'});
  txt(slide,'Offline first  ·  Uttarakhand  ·  Built for curious hikers',0.80,4.57,8.2,0.46,{fontSize:21,color:C.mint});
  txt(slide,'PROJECT PRESENTATION  /  OCTOBER 2026',0.80,6.56,7.4,0.25,{fontSize:11,bold:true,color:C.muted,charSpacing:1.4});
  slide.addNotes('Introduce WILD-AI as an Android field companion for Uttarakhand hikers. The theme borrows the app’s quiet forest glow. Keep the opening to about 20 seconds.');
}

// 2. Problem.
pptx.addSection({ title: 'The need' });
{
  const slide = base('The need',2);
  headline(slide,'The forest does not come with a search bar','Outdoors, the hardest question is often: “Can I trust this answer?”');
  const cards=[
    ['01','Signal disappears','Useful information must still be there.'],
    ['02','Search results conflict','A source needs context and location.'],
    ['03','Photos can mislead','A plausible match is not a safety verdict.'],
  ];
  cards.forEach((c,i)=>{
    const x=0.73+i*4.16;
    rounded(slide,x,2.43,3.83,3.16);
    numberTag(slide,c[0],x+0.35,2.78,i===2?C.amber:C.mint);
    txt(slide,c[1],x+0.35,3.50,3.12,0.48,{fontFace:'Cambria',fontSize:25,bold:true});
    txt(slide,c[2],x+0.35,4.23,3.03,0.84,{fontSize:18,color:C.muted,valign:'top'});
  });
  txt(slide,'Our answer: local knowledge, visible sources, honest uncertainty.',0.76,6.27,11.9,0.47,{fontSize:23,color:C.mint,bold:true});
  slide.addNotes('Describe the three practical problems: no signal, conflicting web information, and overconfident photo matches. The app is designed to help without claiming certainty it does not have.');
}

// 3. Actual app.
pptx.addSection({ title: 'The experience' });
{
  const slide = base('The experience',3);
  headline(slide,'One chat. The trail stays in focus.','A typed question or photo starts the same simple conversation.');
  const steps=[
    ['Choose a region','Uttarakhand statewide or a district'],
    ['Ask or attach','Text, camera, or gallery'],
    ['See what is known','Sources, or a clear “unknown”'],
  ];
  steps.forEach((p,i)=>{
    const y=2.30+i*1.28;
    numberTag(slide,i+1,0.89,y+0.05);
    txt(slide,p[0],1.53,y,5.55,0.39,{fontFace:'Cambria',fontSize:25,bold:true});
    txt(slide,p[1],1.55,y+0.45,5.7,0.38,{fontSize:17,color:C.muted});
  });
  rounded(slide,8.78,1.69,3.15,5.15,C.raised);
  slide.addImage({path:path.join(__dirname,'assets/app-home.png'),x:8.98,y:1.89,w:2.75,h:4.77});
  txt(slide,'Current Android build',8.98,6.72,2.77,0.22,{fontSize:11,color:C.muted,align:'center'});
  slide.addNotes('Show the real app screen. Demonstrate the single chat input and mention that region, history, contacts, and downloads live in the drawer. Keep the explanation under one minute.');
}

// 4. Offline content.
pptx.addSection({ title: 'Offline value' });
{
  const slide = base('Offline value',4);
  headline(slide,'Useful even when the network is gone','The core answer path runs on the phone.');
  rounded(slide,0.74,2.25,5.00,3.80,C.raised);
  txt(slide,'25',1.12,2.48,4.2,1.52,{fontFace:'Cambria',fontSize:85,bold:true,color:C.mint});
  txt(slide,'documented plant records',1.14,4.07,4.22,0.62,{fontSize:23,bold:true});
  txt(slide,'Each record has an area and source.',1.14,4.82,4.10,0.57,{fontSize:17,color:C.muted});
  const info=[
    ['Local context','Select the district; show covered records.'],
    ['Field topics','Weather, flood and park guidance.'],
    ['Contacts','Emergency numbers available offline.'],
  ];
  info.forEach((p,i)=>{
    const y=2.30+i*1.23;
    rounded(slide,6.23,y,6.26,1.04);
    dot(slide,6.54,y+0.34,0.24,i===2?C.amber:C.mint,8);
    txt(slide,p[0],6.99,y+0.18,2.12,0.27,{fontSize:20,bold:true});
    txt(slide,p[1],9.02,y+0.15,3.12,0.62,{fontSize:15.5,color:C.muted});
  });
  txt(slide,'A record describes a species — never a found plant’s safety.',0.80,6.47,11.7,0.31,{fontSize:16.5,color:C.amber});
  slide.addNotes('Explain that 25 records are documented occurrences, not a promise that a plant occurs on every route. A source-backed answer and emergency contact can be retrieved offline. Do not imply that the app certifies edibility.');
}

// 5. Optional online help and privacy.
pptx.addSection({ title: 'Two modes' });
{
  const slide = base('Two modes',5);
  headline(slide,'Offline first. Online when helpful.','The online layer adds breadth without replacing local evidence.');
  rounded(slide,0.75,2.29,5.70,3.55,C.raised);
  rounded(slide,6.87,2.29,5.70,3.55,C.surface);
  dot(slide,1.13,2.66,0.43,C.mint,84);
  txt(slide,'OFFLINE',1.78,2.64,3.91,0.41,{fontSize:22,bold:true,color:C.mint,charSpacing:1});
  txt(slide,'Curated records\nSaved chats & photos\nClear abstention',1.15,3.41,4.65,1.80,{fontFace:'Cambria',fontSize:25,bold:true,breakLine:false,valign:'top'});
  dot(slide,7.26,2.66,0.43,C.violet,84);
  txt(slide,'OPTIONAL ONLINE',7.88,2.64,4.18,0.41,{fontSize:21,bold:true,color:C.violet,charSpacing:1});
  txt(slide,'Linked web summaries\nHosted model pilot\nMarked “unreviewed”',7.27,3.41,4.83,1.80,{fontFace:'Cambria',fontSize:25,bold:true,breakLine:false,valign:'top'});
  txt(slide,'Photos stay on the phone. No provider API key goes in the app.',0.79,6.39,11.79,0.38,{fontSize:18,color:C.mint});
  slide.addNotes('The app always gives its local result first. General questions may receive linked online summaries; a hosted model service exists in code but is not configured live. Photos stay local, while online questions and recent text are sent when the service is used.');
}

// 6. Experimental model evidence.
pptx.addSection({ title: 'Plant photos' });
{
  const slide = base('Plant photos',6);
  headline(slide,'A possible match — never a safety verdict','The current 12-species photo model is a research candidate.');
  const stats=[
    [0.79,'45 / 60','known test photos correctly accepted',C.mint],
    [6.90,'25 / 100','new unknown photos wrongly accepted',C.amber],
  ];
  stats.forEach(([x,big,caption,color])=>{
    rounded(slide,x,2.46,5.61,2.78,C.raised);
    txt(slide,big,x+0.41,2.75,4.85,0.96,{fontFace:'Cambria',fontSize:45,bold:true,color});
    txt(slide,caption,x+0.43,3.92,4.66,0.76,{fontSize:19.5,color:C.text,valign:'top'});
  });
  txt(slide,'What we do with that evidence',0.81,5.78,3.94,0.37,{fontSize:20,bold:true,color:C.mint});
  txt(slide,'Show “unknown” when uncertain. Hold public release for independent field testing.',0.81,6.26,11.73,0.65,{fontSize:18.5,color:C.text,valign:'top'});
  slide.addNotes('Be candid: the model is integrated, but the open-set stress test exposed serious false acceptance. The two denominators matter. This is why the app never uses a photo match for edibility or treatment. Avoid calling the model accurate or field ready.');
}

// 7. Plan.
pptx.addSection({ title: 'Pilot path' });
{
  const slide = base('Pilot path',7);
  headline(slide,'A small pilot, with a clear release gate','Progress is measured by safe behaviour, not just features.');
  const steps=[
    ['BUILT','Android chat\nOffline answers\nPhoto + feedback',C.mint],
    ['VALIDATE','Review sources\nTest field photos\nCheck device speed',C.violet],
    ['PILOT','5–10 hikers\nGuided routes\nLog failures',C.amber],
  ];
  steps.forEach((s,i)=>{
    const x=0.77+i*4.19;
    rounded(slide,x,2.40,3.83,3.75,i===0?C.raised:C.surface);
    dot(slide,x+0.34,2.72,0.28,s[2],20);
    txt(slide,s[0],x+0.76,2.66,2.72,0.38,{fontSize:20,bold:true,color:s[2],charSpacing:1});
    txt(slide,s[1],x+0.37,3.43,3.11,1.98,{fontFace:'Calibri',fontSize:19.5,bold:true,breakLine:false,valign:'top'});
  });
  txt(slide,'Release only after content and model risks are reviewed.',0.81,6.47,11.81,0.31,{fontSize:17,color:C.muted});
  slide.addNotes('Explain the current build, then the validation work, then the supervised pilot. Five to ten hikers is the planned small group, not a completed study. Public release is gated on independent evidence.');
}

// 8. Close / prompt for live demo.
pptx.addSection({ title: 'Closing' });
{
  const slide = base('Closing',8);
  shape(slide,S.ellipse,9.32,-1.19,5.70,5.70,{color:C.teal,transparency:75});
  shape(slide,S.ellipse,-1.45,5.55,4.00,3.54,{color:C.raised,transparency:8});
  txt(slide,'Stay curious.\nStay cautious.',0.78,1.39,10.17,1.93,{fontFace:'Cambria',fontSize:50,bold:true,valign:'top'});
  txt(slide,'WILD.AI makes field information easier to reach — and uncertainty easier to see.',0.82,3.74,10.93,1.12,{fontSize:25,color:C.mint,valign:'top'});
  rounded(slide,0.81,5.55,8.58,0.79,C.raised);
  txt(slide,'LIVE DEMO  “What plants are documented in Corbett?”',1.10,5.77,7.98,0.35,{fontSize:18,bold:true,color:C.text});
  txt(slide,'Questions?',0.83,6.65,3.46,0.35,{fontSize:18,color:C.muted});
  slide.addNotes('Close with the project’s central promise: useful information offline, and visible uncertainty when evidence is weak. If there is time, demo the Corbett question in the installed Android app. Invite questions.');
}

(async () => {
  const out=path.join(__dirname,'WILD_AI_Project_Presentation.pptx');
  await pptx.writeFile({fileName:out});
  await applyTheme(out,theme);
  console.log(out);
})();
