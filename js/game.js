const Game = {

    name: 'Jump for your life',
    author: 'Diego Silva y Elena Frontiñán',
    version: '1.0',
    license: undefined,

    gameSize: {
        width: 700,
        height: window.innerHeight,
        padding: {
            topbottom: 20,
            leftright: 20
        }
    },

    framesCounter: 0,

    background: undefined,

    player: undefined,

    visibleRowNumber: 5,
    visiblePlatformNumer: 7,

    currentRowNumber: 0,
    currentDirection: -1,

    platformArray: [],
    uniqueId: 0,

    platformSpecs: {
        distance: 150,
        width: 100,
        height: 100
    },

    isColliding: false,
    alreadyCollision: false,
    currentPlatform: [],

    totalPoints: 0,

    interval: '',

    keys: {
        MOVEUP: 'ArrowUp',
        MOVERIGHT: 'ArrowRight',
        MOVELEFT: 'ArrowLeft'
    },

    platform: undefined,

    init() {

        this.setDimensions()
        this.setEventListeners()
        this.printInfoJumps()

    },

    start() {

        this.createElements()
        this.startGameLoop()
        document.getElementById('start-modal').style.display = 'none'

        const audioElement = document.createElement("audio")
        audioElement.src = "audio/soundStart.mp3"
        audioElement.play()
        audioElement.loop = true
        audioElement.volume = 0.3

    },

    setEventListeners() {

        let moveFirstkey = false

        document.addEventListener("keydown", e => {
            switch (e.code) {

                case this.keys.MOVEUP:
                    if (moveFirstkey) {

                        this.player.moveUp()
                        this.background.moveBackground()
                        this.background.updateBackground()
                        this.collisionDetection()

                    } else {

                        this.player.moveUp()
                        this.collisionDetection()
                        moveFirstkey = true

                    }
                    break

                case this.keys.MOVERIGHT:
                    this.player.moveRight()
                    this.collisionDetection()
                    break

                case this.keys.MOVELEFT:
                    this.player.moveLeft()
                    this.collisionDetection()
                    break
            }
        })
    },

    setDimensions() {

        document.querySelector("#game-screen").style.width = `${this.gameSize.width}px`
        document.querySelector("#game-screen").style.height = `${this.gameSize.height}px`

    },

    printInfoJumps() {

        document.getElementById("jump-max-number").innerHTML = localStorage.getItem('maxPoints')
        document.getElementById("jump-number").innerHTML = this.totalPoints

    },

    createElements() {

        this.createPlatforms()
        this.background = new Background(this.gameSize)
        this.player = new Player(this.gameSize, this.platformSpecs)

    },

    createPlatforms() {

        for (let i = 1; i < this.visibleRowNumber; i++) {

            for (let j = 0; j < this.visiblePlatformNumer; j++) {

                this.platform = new Platform(this.gameSize, i, this.platformSpecs, this.getRandomType(), j, this.uniqueId)
                this.platformArray.push(this.platform)
                this.uniqueId++

            }

            this.currentRowNumber++

        }

        this.getStablePlatform()

    },

    createNewPlatforms() {
        if (this.isColliding && this.alreadyCollision) {

            this.platformArray.forEach((eachPlatform) => {
                eachPlatform.rowNumber -= 1
                eachPlatform.updateTopPosition(eachPlatform.rowNumber)
            })

            this.currentRowNumber -= 1

            const lastRowNumber = this.platformArray[this.platformArray.length - 1].rowNumber

            for (let j = 0; j < this.visiblePlatformNumer; j++) {
                const platform = new Platform(this.gameSize, lastRowNumber + 1, this.platformSpecs, this.getRandomType(), j, this.uniqueId)
                platform.direction = this.currentDirection
                this.platformArray.push(platform)
                this.uniqueId++
            }

            this.currentDirection *= -1
            this.currentRowNumber++
            this.isColliding = false
        }
    },

    getStablePlatform() {

        let hasStablePlatform = false

        for (let i = 1; i < this.visibleRowNumber; i++) {

            const rowArray = this.platformArray.filter(eachPlatform => {
                return eachPlatform.rowNumber === i
            })

            const stableArray = rowArray.filter(element => {
                return element.type === 'stable'
            })

            if (stableArray.length < 2) {

                hasStablePlatform = false

                rowArray[1].type = 'stable'
                rowArray[1].createPlatform()

                rowArray[3].type = 'stable'
                rowArray[3].createPlatform()

            }

            if (stableArray.length > 3) {

                rowArray[2].type = 'weak'
                rowArray[2].createPlatform()

                rowArray[4].type = 'weak'
                rowArray[4].createPlatform()

            }

        }

    },

    getRandomType() {

        let randomNumber = Math.random()

        if (randomNumber >= .3) {
            return 'stable'
        }

        if (randomNumber < .3) {
            return 'weak'
        }

    },

    collisionDetection() {

        const playerPos = this.player.playerPos
        const playerSize = this.player.playerSize

        this.platformArray.forEach((eachPlatform, idx) => {

            const platformPos = eachPlatform.platformPos
            const platformSize = eachPlatform.platformSize

            if (
                playerPos.left < platformPos.left + platformSize.width &&
                playerPos.left + playerSize.width > platformPos.left &&
                playerPos.top < platformPos.top + platformSize.height &&
                playerPos.top + playerSize.height > platformPos.top
            ) {

                this.totalPoints++
                this.isColliding = true

                this.currentPlatform = [idx, eachPlatform.uniqueId, eachPlatform.visibleRowNumber, eachPlatform.index, platformPos.left, platformPos.top, eachPlatform.type]

                if (this.currentPlatform.length > 0) {
                    this.player.updatePosition(this.platformArray.filter(elm => {
                        return elm.uniqueId === this.currentPlatform[1]
                    }))
                }

                this.createNewPlatforms()

                if (eachPlatform.type === 'weak') {
                    this.totalPoints--
                    this.gameOver('JAJAJAAJ Te lo avisamos, cuidado con caer atrapado... ¿Un nuevo intento?', 'weakPlatform')
                }

                this.alreadyCollision = true

                this.updateLocalStorage()

                throw this.isColliding

            } else {
                this.isColliding = false
            }

        })

        if (!this.isColliding) {

            if (this.currentPlatform.length > 0) {
                this.player.updatePosition(this.platformArray.filter(elm => {
                    return elm.uniqueId === this.currentPlatform[1]
                }))
            }

            this.gameOver('Los fantasmas también pueden morir... ¡¡Se siente!!', 'notColling')

        }

        return this.onPlatform

    },

    updateLocalStorage() {

        if (!localStorage.getItem('maxPoints') || Number(localStorage.getItem('maxPoints')) < this.totalPoints) {
            localStorage.setItem('maxPoints', this.totalPoints)
        }

    },

    resetGame() {

        document.getElementById("lose-modal").style.display = "none"

        this.startGameLoop()

        this.player.resetPosition()

        this.background.resetPosition()

        this.platformArray.forEach(elm => {
            elm.platform.remove()
        })

        this.platformArray = []
        this.currentPlatform = []

        this.currentRowNumber = 0
        this.alreadyCollision = false

        this.createPlatforms()

        this.totalPoints = 0
        this.framesCounter = 0

        this.updateLocalStorage()

        this.printInfoJumps()

    },

    startGameLoop() {

        this.interval = setInterval(() => {
            this.movePlatforms()
            this.framesCounter++
            this.updateElements()
            this.printInfoJumps()
            this.clearAll()
        }, 20)

    },

    movePlatforms() {

        this.framesCounter += 2

        this.platformArray.forEach((eachPlatform) => {

            if (this.framesCounter >= (-eachPlatform.initialLeft + 2 * eachPlatform.distance)) {

                eachPlatform.revertDirection()
            }

            eachPlatform.platformPos.left += 2 * eachPlatform.direction
            eachPlatform.platform.style.left = `${eachPlatform.platformPos.left}px`
        })

        if (this.framesCounter >= (-(this.platform.initialLeft) + 2 * (this.platform.distance))) {
            this.framesCounter = 0
        }

    },

    updateElements() {

        const exceedsRight = this.player.playerPos.left >= this.gameSize.width
        const exceedsLeft = this.player.playerPos.left + this.player.platformSize.width / 2 <= 0

        if (this.currentPlatform.length > 0) {

            this.player.updatePosition(this.platformArray.filter(elm => {
                return elm.uniqueId === this.currentPlatform[1]
            }))

        }

        if (exceedsRight || exceedsLeft) {
            this.gameOver('No te escapas... ¿crees que conseguirás llegar más lejos?', 'exceedsPlayer')
        }

    },

    clearAll() {

        this.platformArray.forEach((elem, idx) => {
            if (elem.visibleRowNumber === -1) {
                elem.platform.remove()
                this.platformArray.splice(idx, 1)
            }
        })

    },

    gameOver(menssage, type) {
        const audioElement = document.createElement("audio")

        if (type == 'notColling') {
            audioElement.src = "audio/soundFalls.mp3"
            audioElement.volume = 1.0
            audioElement.play()

        } else if (type == 'weakPlatform') {
            audioElement.src = "audio/soundGameOver.mp3"
            audioElement.volume = 1.0
            audioElement.play()

        } else if (type == 'exceedsPlayer') {
            audioElement.src = "audio/soundGameOver.mp3"
            audioElement.volume = 1.0
            audioElement.play()

        }

        this.updateLocalStorage()
        document.getElementById("lose-modal").style.display = "flex"
        document.getElementById("jump-number-lose").innerHTML = this.totalPoints
        document.getElementById("loss-reason").innerHTML = menssage

        clearInterval(this.interval)

    },

}