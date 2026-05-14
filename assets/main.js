var NRB = window.NRB_DATA || {}
var root = document.querySelector(':root')
const body = document.querySelector('body');
var lang = NRB.resolveLang ? NRB.resolveLang() : (window.lang || 'en')
if(NRB.setLang){
  NRB.setLang(lang, { persist: false })
}
else{
  window.lang = lang
  document.documentElement.lang = lang == 'cn' ? 'zh-Hans' : 'en'
}
var initialDarkMode = NRB.resolveDarkMode ? NRB.resolveDarkMode() : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
if(initialDarkMode){
  root.classList.add('dark')
}


var d = new Vue({
  el: '#app',
  data: {
    p: 0,
    w: 660,
    h: 530,
    mX: 0,
    mY: 0,
    lang: lang,
    showModal: false,
    showAllCornerNames: false,
    darkMode: initialDarkMode,
    showCorner: false,
    showSection: false,
    currentCorner: null,
    scrollDistance: 0,
    cornerStart: 0,
    cornerEnd: 0,
    sectionStart: 0,
    sectionEnd: 0,
    trackD: NRB.TRACK_PATH || "",
    cornerMarkers: [],
    bridges: NRB.bridges || [],
    sections: NRB.sections || [],
    corners: NRB.corners || [],
    aboutContent: NRB.aboutContent || "",
    modalContent: "",
    modalType: "text",
    lastFocus: null,
    trackPath: null,
    trackLength: 0
  },
  methods: {
    innerModal: function(e){
      e.stopPropagation()
    },
    toggleLang(){
      if(this.lang == "en"){
        this.lang = "cn"
      }
      else{
        this.lang = "en"
      }
      lang = this.lang
      if(NRB.setLang){
        NRB.setLang(this.lang)
      }
      else{
        window.lang = this.lang
        document.documentElement.lang = this.lang == "cn" ? "zh-Hans" : "en"
      }
    },
    toggleDarkMode(){
      this.darkMode =!this.darkMode
      if(this.darkMode == true){
        root.classList.add("dark")
      }
      else{
        root.classList.remove("dark")
      }
      if(NRB.setDarkMode){
        NRB.setDarkMode(this.darkMode)
      }
    },
    setP: function(percentage){
      percentage = Math.max(0, Math.min(1, percentage))
      refreshScrollMetrics()
      this.p = percentage
      window.scrollTo(0, _scrollMax * percentage);
      updateScrollDistance()
    },
    openModal: function(type, img=null){
      this.lastFocus = document.activeElement
      this.modalType = type
      if(type == 'text') this.modalContent = this.aboutContent
      if(type == 'image'){
        this.modalContent = "<img src='" + 'https://s.anyway.red/nurburgring/' + img.src + '!/quality/80/progressive/true/ignore-error/true' + "'/>"
        if(img.url) this.modalContent += "<div class='source-in-modal'>@<a href='" + img.url + "' target='_blank'>" + img.author + "</a></div>"
      }
      this.showModal = true
      this.$nextTick(function(){
        var modal = type == 'image' ? this.$refs.imageModal : this.$refs.textModal
        if(modal && modal.focus) modal.focus()
      })
    },
    closeModal: function(){
      this.showModal = false
      var lastFocus = this.lastFocus
      this.$nextTick(function(){
        if(lastFocus && lastFocus.focus) lastFocus.focus()
      })
    },
    getCornerKm: function(corner){
      return (corner.st * ((NRB.LAP_LENGTH_M || 20832) / 1000)).toFixed(1)
    },
    initTrackMetrics: function(){
      var pathEl = document.getElementById('track')
      if(!pathEl) return
      this.trackPath = pathEl
      this.trackLength = pathEl.getTotalLength()
      var trackLength = this.trackLength
      this.cornerMarkers = this.corners.map(function(corner){
        var point = pathEl.getPointAtLength(corner.st * trackLength)
        return {
          x: point.x,
          y: point.y,
          st: corner.st,
          ed: corner.ed
        }
      })
    },
    findCornerByProgress: function(progress, direction){
      var arr = this.corners
      var lo = 0, hi = arr.length - 1, idx = -1
      while (lo <= hi) {
        var mid = (lo + hi) >> 1
        if (arr[mid].st <= progress) {
          idx = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }
      if (direction === 'prev') {
        if (idx > 0) return arr[idx - 1]
        return null
      }
      if (direction === 'next') {
        if (idx < 0) return arr[0]
        if (idx >= 0 && idx < arr.length - 1) return arr[idx + 1]
        return arr[0]
      }
      if (idx >= 0 && progress >= arr[idx].st && progress <= arr[idx].ed) return arr[idx]
      return null
    }

  }
})

var _scrollTicking = false
var _scrollMax = 1
var _lastHashProgress = null

function refreshScrollMetrics(){
  _scrollMax = Math.max(1, body.scrollHeight - window.innerHeight)
}

function updateScrollDistance(){
  d.showCorner = false
  d.showSection = false
  d.currentCorner = null
  var progress = window.scrollY / _scrollMax
  if(progress > 1){
    progress = 1
  }
  if(progress < 0){
    progress = 0
  }
  document.body.classList.toggle("scrolled", window.scrollY > 2)
  body.style.setProperty('--p', progress)
  d.p = progress

  // Binary search for current corner
  var corner = d.findCornerByProgress(progress)
  if(corner){
    d.showCorner = true
    d.cornerStart = corner.st
    d.cornerEnd = corner.ed
    d.currentCorner = corner
  }

  d.sections.forEach((section)=>{
    if(progress > section.st && progress < section.ed){
      d.showSection = true
      d.sectionStart = section.st
      d.sectionEnd = section.ed
    }
  })
}

function throttledScrollUpdate(){
  if(!_scrollTicking){
    requestAnimationFrame(function(){
      updateScrollDistance()
      _scrollTicking = false
    })
    _scrollTicking = true
  }
}

var _hashTimer = null
function scheduleHashUpdate(progress){
  progress = Math.max(0, Math.min(1, progress))
  if(_lastHashProgress !== null && Math.abs(_lastHashProgress - progress) < 0.0005) return
  if(_hashTimer) clearTimeout(_hashTimer)
  _hashTimer = setTimeout(function(){
    try{
      history.replaceState(null, '', '#' + progress.toFixed(4))
      _lastHashProgress = progress
    }catch(e){}
  }, 300)
}

function restoreFromHash(){
  var hash = window.location.hash
  if(hash && hash.length > 1){
    var val = parseFloat(hash.substring(1))
    if(!isNaN(val) && val >= 0 && val <= 1){
      setTimeout(function(){
        d.setP(val)
      }, 100)
    }
  }
}

function updatePageHeight(){
  var isPortrait = window.matchMedia ? window.matchMedia('(orientation: portrait)').matches : (window.innerHeight >= window.innerWidth)
  if(isPortrait){
    body.classList.remove("horizontal")
    body.classList.add("vertical")
  }
  else{
    body.classList.remove("vertical")
    body.classList.add("horizontal")
  }
}

window.addEventListener('scroll', function(){
  throttledScrollUpdate()
  scheduleHashUpdate(window.scrollY / _scrollMax)
}, { passive: true })

window.addEventListener('resize', function(){
  refreshScrollMetrics()
  updateScrollDistance()
  updatePageHeight()
})

if(window.matchMedia){
  var portraitMq = window.matchMedia('(orientation: portrait)')
  if(portraitMq.addEventListener){
    portraitMq.addEventListener('change', updatePageHeight)
  }
}

refreshScrollMetrics()
updateScrollDistance()
updatePageHeight()

window.addEventListener("keyup",function(e){
  if(e.key === "Escape") {
    d.closeModal()
  }
  if(d.showModal) return
  if(e.key === "ArrowRight"){
    var next = d.findCornerByProgress(d.p, 'next')
    if(next) d.setP((next.st + next.ed) / 2)
  }
  if(e.key === "ArrowLeft"){
    var prev = d.findCornerByProgress(d.p, 'prev')
    if(prev) d.setP((prev.st + prev.ed) / 2)
  }
})

var trackInner = document.querySelector('.track-map > .inner')
if(trackInner){
  trackInner.addEventListener('mousemove', function(event) {
    const innerRect = this.getBoundingClientRect();
    d.mX = (event.clientX - innerRect.left) / innerRect.width
    d.mY = (event.clientY - innerRect.top) / innerRect.height
  }, { passive: true });
}

// Mount hook: init track path reference and restore URL hash
d.$nextTick(function(){
  d.initTrackMetrics()
  refreshScrollMetrics()
  updateScrollDistance()
  restoreFromHash()
})
