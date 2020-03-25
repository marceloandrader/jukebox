import Controller from '@ember/controller'
import { action } from '@ember/object'
import { tracked } from '@glimmer/tracking'
import jsQR from 'jsqr'
import Url from 'url-parse'
import qs from 'qs'
import { later } from '@ember/runloop'

export default class ApplicationController extends Controller {
  @tracked currentVideo = 'asg043Yo6ns'
  emberYoutube = null

  playerVars = {
    autoplay: 1,
    loop: 1
  }

  initVideo (parseFn) {
    let video = document.createElement('video')
    let canvasElement = document.getElementById('canvas')
    let canvas = canvasElement.getContext('2d')
    let loadingMessage = document.getElementById('loadingMessage')
    let outputContainer = document.getElementById('output')
    let outputMessage = document.getElementById('outputMessage')

    function drawLine (begin, end, color) {
      canvas.beginPath()
      canvas.moveTo(begin.x, begin.y)
      canvas.lineTo(end.x, end.y)
      canvas.lineWidth = 4
      canvas.strokeStyle = color
      canvas.stroke()
    }

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(function (stream) {
        video.srcObject = stream
        video.setAttribute('playsinline', true) // required to tell iOS safari we don't want fullscreen
        video.play()
        requestAnimationFrame(tick)
      })

    function tick () {
      loadingMessage.innerText = '⌛ Loading video...'
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true
        canvasElement.hidden = false
        outputContainer.hidden = false

        canvasElement.height = video.videoHeight
        canvasElement.width = video.videoWidth
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height)
        let imageData = canvas.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height
        )
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        })
        if (code) {
          drawLine(
            code.location.topLeftCorner,
            code.location.topRightCorner,
            '#FF3B58'
          )
          drawLine(
            code.location.topRightCorner,
            code.location.bottomRightCorner,
            '#FF3B58'
          )
          drawLine(
            code.location.bottomRightCorner,
            code.location.bottomLeftCorner,
            '#FF3B58'
          )
          drawLine(
            code.location.bottomLeftCorner,
            code.location.topLeftCorner,
            '#FF3B58'
          )
          outputMessage.hidden = true
          parseFn(code.data)
        } else {
          outputMessage.hidden = false
        }
      }
      requestAnimationFrame(tick)
    }
  }

  parseVideoURL (urlString) {
    const url = new Url(urlString)
    const query = qs.parse(url.query)
    for (let key in query) {
      if ((key === '?v' || key === 'v') && this.currentVideo !== query[key]) {
        this.anotherVideo(query[key])
      }
    }
  }

  @action
  anotherVideo (youtubeid) {
    this.currentVideo = youtubeid
    this.emberYoutube.get('player').playVideoAt(10)
  }

  @action
  startWebcam () {
    console.log('starting webcam')
    later(() => {
      this.initVideo(this.parseVideoURL.bind(this))
    }, 1000)
  }
}
