/* global preloadImagesTmr fxhash fxrand paper1Loaded */

//
//  fxhash - 10PRINT
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Global values, because today I'm being an artist not an engineer!
const ratio = 1 // canvas ratio
const features = {} //  so we can keep track of what we're doing
const nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let drawStarted = false // Flag if we have kicked off the draw loop
let thumbnailTaken = false
let forceDownloaded = false
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = '10PRINT-example'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'
// const startTime = new Date().getTime()

window.$fxhashFeatures = {}


//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }

  features.tileCount = 7
  features.tiles = {}
  //  Create a map of left or right
  for (let y = 0; y < features.tileCount; y++) {
    for (let x = 0; x < features.tileCount; x++) {
      features.tiles[`${x}-${y}`] = {
        x,
        y,
        direction: fxrand() > 0.5 ? 1 : 0
      }
    }
  }
  // There is a 40/60 chance we draw a red grid over the top
  features.grid = fxrand() > 0.6
  //  40/60 draw curves instead of lines
  features.curves = fxrand() > 0.6

  window.$fxhashFeatures.Tiles = 7
  window.$fxhashFeatures.Format = 'Lines'
  window.$fxhashFeatures['Show grid'] = false
  if (features.curves) window.$fxhashFeatures.Format = 'Curves'
  if (features.grid) window.$fxhashFeatures['Show grid'] = true

  // window.$fxhashFeatures.Smooth = features.Smooth
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawStarted = true
  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Lay down the paper texture
  ctx.fillStyle = features.paper1Pattern
  ctx.save()
  ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
  ctx.fillRect(0, 0, w * 2, h * 2)
  ctx.restore()

  //  Work out the size of each tile
  const tileSize = w / features.tileCount
  //  Set the line colour to black
  ctx.strokeStyle = '#000000'
  //  Set the size of the line
  ctx.lineWidth = tileSize / 10
  //  Set the line cap to rounded
  ctx.lineCap = 'round'

  //  Loop over the feature tiles and then draw them
  for (const tile of Object.values(features.tiles)) {
    //  Work out the position of the tile
    const x = tile.x * tileSize
    const y = tile.y * tileSize
    //  If we are drawing curves then do that
    if (features.curves) {
      //  If we are going one way draw the curves in the top left and bottom right corners
      if (tile.direction === 1) {
        ctx.beginPath()
        ctx.moveTo(x + (tileSize / 2), y)
        ctx.arc(x, y, (tileSize / 2), 0, Math.PI / 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + (tileSize / 2), y + tileSize)
        ctx.arc(x + tileSize, y + tileSize, (tileSize / 2), Math.PI, Math.PI * 1.5)
        ctx.stroke()
      } else {
        //  If we are going the other way draw the curves in the top right and bottom left corners
        ctx.beginPath()
        ctx.moveTo(x + tileSize, y + (tileSize / 2))
        ctx.arc(x + tileSize, y, (tileSize / 2), Math.PI * 0.5, Math.PI * 1)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y + (tileSize / 2))
        ctx.arc(x, y + tileSize, (tileSize / 2), Math.PI * 1.5, Math.PI * 2)
        ctx.stroke()
      }
    } else {
      //  If the direction is 1 we go one way, otherwise go the other
      ctx.beginPath()
      if (tile.direction === 1) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + tileSize, y + tileSize)
      } else {
        ctx.moveTo(x + tileSize, y)
        ctx.lineTo(x, y + tileSize)
      }
      ctx.stroke()
    }
  }

  //  If we are supposed to draw a grid, then do that
  if (features.grid) {
    //  Set the line colour to red
    ctx.strokeStyle = '#ff0000'
    //  Set the size of the line
    ctx.lineWidth = tileSize / 50
    //  Set the line cap to rounded
    ctx.lineCap = 'round'
    // Loop over the number of tiles so we can draw the horizontal and vertical lines
    for (let i = 0; i < features.tileCount; i++) {
      ctx.beginPath()
      ctx.moveTo(i * tileSize, 0)
      ctx.lineTo(i * tileSize, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * tileSize)
      ctx.lineTo(w, i * tileSize)
      ctx.stroke()
    }
  }

  //  Draw a border around the edge
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = tileSize / 5
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.stroke()

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    // nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

//  This is where we layout the canvas, and redraw the textures
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  drawCanvas()
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // Custom controls
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  Normally we would have a test
  // if (true === true) {
  if (paper1Loaded && !drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }
}

console.table(window.$fxhashFeatures)
