// The multiverse registry — one entry per site. The dot-ring, the edge
// function count (netlify/edge-functions/roll.js — keep COUNT in sync), and
// each site's shell read from here.
export type Site = {
  id: number;
  name: string;
  paper: string; // background
  ink: string;   // text / curtain color
  swatch: string; // the site's dot on the ring
};

export const SITES: Site[] = [
  { id: 1, name: 'One', paper: '#FFEDDB', ink: '#2B1F1A', swatch: '#BF9270' },
  { id: 2, name: 'Two', paper: '#FAFAF7', ink: '#101010', swatch: '#9A9A9A' },
  { id: 3, name: 'Three', paper: '#FFFFFF', ink: '#141414', swatch: '#4A4A4A' },
  { id: 4, name: 'Four', paper: '#EC5B13', ink: '#141210', swatch: '#EC5B13' },
  { id: 5, name: 'Five', paper: '#FFFFFF', ink: '#0A0A0A', swatch: '#2431FF' },
  { id: 6, name: 'Six', paper: '#FAF8F3', ink: '#141310', swatch: '#1F8A70' },
  // 7 is an open door — Tres named this one "site 8" and the brand says 08.
  // Both rollers (below + roll.js) pick from the id LIST, never 1..COUNT.
  { id: 8, name: 'Eight', paper: '#F6F4EE', ink: '#141310', swatch: '#D8341F' },
];

// Serialized for the client scripts (ring, curtain) + the refresh-roll.
//
// REFRESH-ROLL (design: docs/specs/2026-07-11-refresh-roll-design.md):
// a refresh anywhere serves the same page from a DIFFERENT universe; in-site
// navigation and back/forward never re-roll. Runs synchronously at the top of
// <head> so a roll aborts the page before it paints.
//   reload on /N/...  -> location.replace same path in another universe
//   back/forward      -> no roll; arriving back at "/" after a bfcache miss
//                        (the edge re-rolled under us) restores the universe
//                        this tab was in via /?u=
//   navigate          -> trust the URL (ring dots + deep links stay deliberate)
//   ?u=N on any page  -> pin: jump there if needed, never roll (dev/QA/F5)
// Keys: sessionStorage 'mv:u' = this tab's universe; 'mv:restored' = one-shot
// flag so the ?u a restore adds gets stripped back off the URL (organic ?u
// links keep theirs); cookie 'mv_last' mirrors the edge function's anti-repeat
// (netlify/edge-functions/roll.js) so the front door never rolls the universe
// you're already in. Lab pages inject current=0 and no-op. location.replace
// loads report type 'navigate', so a roll can never loop.
export const MV_CLIENT = (current: number) =>
  `window.MV=${JSON.stringify({ current, sites: SITES })};
(function(){
  var MV=window.MV; if(!MV||!MV.current) return;
  var cur=MV.current, path=location.pathname;
  var ids=[]; for(var i=0;i<MV.sites.length;i++) ids.push(MV.sites[i].id);
  function put(n){ try{sessionStorage.setItem('mv:u',String(n));}catch(e){} }
  function last(n){ try{document.cookie='mv_last='+n+';path=/;max-age=2592000;samesite=lax';}catch(e){} }
  function swap(n){ return path.replace(/^\\/\\d+/,'/'+n)+location.search+location.hash; }
  var u=0; try{u=parseInt(new URLSearchParams(location.search).get('u'),10)||0;}catch(e){}
  var t='navigate';
  try{
    var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
    var pn=performance.navigation?performance.navigation.type:0;
    t=nav?nav.type:(pn===1?'reload':pn===2?'back_forward':'navigate');
  }catch(e){}
  if(ids.indexOf(u)!==-1){
    put(u); last(u);
    if(u!==cur&&path!=='/'){ location.replace(swap(u)); return; }
    // Strip ?u at '/' ONLY when the back_forward restore below created it —
    // shared "/?u=3" links keep their pin (F5 stays put), and only the 'u'
    // param goes (utm_* + hash survive for analytics).
    if(path==='/'){ try{
      if(sessionStorage.getItem('mv:restored')){
        sessionStorage.removeItem('mv:restored');
        var q=new URLSearchParams(location.search); q.delete('u'); var r=q.toString();
        history.replaceState(null,'','/'+(r?'?'+r:'')+location.hash);
      }
    }catch(e){} }
    return;
  }
  if(t==='reload'&&path!=='/'){
    var o=[]; for(var j=0;j<ids.length;j++) if(ids[j]!==cur) o.push(ids[j]);
    var n=o[Math.floor(Math.random()*o.length)];
    put(n); last(n); location.replace(swap(n)); return;
  }
  if(t==='back_forward'&&path==='/'){
    var s=0; try{s=parseInt(sessionStorage.getItem('mv:u'),10)||0;}catch(e){}
    if(ids.indexOf(s)!==-1&&s!==cur){
      try{sessionStorage.setItem('mv:restored','1');}catch(e){}
      var q2=new URLSearchParams(location.search); q2.set('u',String(s));
      location.replace('/?'+q2.toString()+location.hash); return;
    }
  }
  put(cur); last(cur);
})();`;
