import { readFileSync, writeFileSync } from "fs"

class ImageEditor {
    constructor() {
        return
    }

    public run(): void {
        if (process.argv.length < 5) {
            this.usage()
            return
        }

        const inputFile: string = process.argv[2]
        const outputFile: string = process.argv[3]
        const filter: string = process.argv[4]

        const image: MyImage = this.read(inputFile)

        if (filter === 'grayscale' || filter === 'greyscale') {
            if (process.argv.length !== 5) {
                this.usage()
                return
            }
            this.grayscale(image)
        } else if (filter === 'invert') {
            if (process.argv.length !== 5) {
                this.usage()
                return
            }
            this.invert(image)
        } else if (filter === 'emboss') {
            if (process.argv.length !== 5) {
                this.usage()
                return
            }
            this.emboss(image)
        } else if (filter === 'motionblur') {
            if (process.argv.length !== 6) {
                this.usage()
                return
            }

            let length: number = -1
            try {
                length = parseInt(process.argv[5])
            } catch (err) {
                console.log(err)
            }

            if (length < 0) {
                this.usage()
                return
            }

            this.motionBlur(image, length)
        } else {
            this.usage()
        }

        this.write(image, outputFile)
    }

    private usage = (): void => {
        console.log('USAGE: npm run start <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}')
    }

    private motionBlur = (image: MyImage, length: number): void => {
        if (length < 1) {
            return
        }

        for (let x: number = 0; x < image.getWidth(); ++x) {
            for (let y: number = 0; y < image.getHeight(); ++y) {
                const currColor: Color = image.get(x, y)
                const maxX: number = Math.min(image.getWidth() - 1, x + length - 1)

                for (let i: number = x + 1; i <= maxX; ++i) {
                    const tmpColor: Color = image.get(i, y)
                    currColor.red += tmpColor.red
                    currColor.green += tmpColor.green
					currColor.blue += tmpColor.blue
                }

                const delta: number = (maxX - x + 1)
                currColor.red = Math.floor(currColor.red / delta)
                currColor.green = Math.floor(currColor.green / delta)
                currColor.blue = Math.floor(currColor.blue / delta)
            }
        }
    }

    private invert = (image: MyImage): void => {
        for (let x: number = 0; x < image.getWidth(); ++x) {
            for (let y: number = 0; y < image.getHeight(); ++y) {
               const currColor = image.get(x, y)

               currColor.red = 255 - currColor.red
               currColor.green = 255 - currColor.green
               currColor.blue = 255 - currColor.blue
            }
        }
    }

    private grayscale = (image: MyImage): void => {
        for (let x: number = 0; x < image.getWidth(); ++x) {
            for (let y: number = 0; y < image.getHeight(); ++y) {
                const currColor: Color = image.get(x, y)
                
                const { red, green, blue} = currColor

                let grayLevel: number = Math.floor((red + green + blue) / 3)
                grayLevel = Math.max(0, Math.min(grayLevel, 255))

                currColor.red = grayLevel
                currColor.green = grayLevel
                currColor.blue = grayLevel
            }
        }
    }

    private emboss = (image: MyImage): void => {
        for (let x: number = image.getWidth() - 1; x >= 0; --x) {
            for (let y: number = image.getHeight() - 1; y >= 0; --y) {
                const currColor: Color = image.get(x, y)
                
                let diff: number = 0

                if (x > 0 && y > 0) {
                    const upLeftColor: Color = image.get(x - 1, y - 1)
                    if (Math.abs(currColor.red - upLeftColor.red) > Math.abs(diff)) {
                        diff = currColor.red - upLeftColor.red
                    }
                    if (Math.abs(currColor.green - upLeftColor.green) > Math.abs(diff)) {
                        diff = currColor.green - upLeftColor.green
                    }
                    if (Math.abs(currColor.blue - upLeftColor.blue) > Math.abs(diff)) {
                        diff = currColor.blue - upLeftColor.blue
                    }
                }

                let grayLevel: number = 128 + diff
                grayLevel = Math.max(0, Math.min(grayLevel, 255))

                currColor.red = grayLevel
                currColor.green = grayLevel
                currColor.blue = grayLevel
            }
        }
    }

    private read = (filePath: string): MyImage => {
        const fileBytes: string[] = readFileSync(filePath)
            .toString()
            .replaceAll('\r', ' ') // remove carriage returns
            .replaceAll('\n', ' ') // remove newlines
            .split(' ') // remove spaces
            .filter(num => num) // filter out empty strings

        const width: number = parseInt(fileBytes[1])
        const height: number = parseInt(fileBytes[2])

        const image: MyImage = new MyImage(width, height)

        let nextInt: number = 4
        for (let y: number = 0; y < height; ++y) {
            for (let x: number = 0; x < width; ++x) {
                const color: Color = new Color()
                color.red = parseInt(fileBytes[nextInt])
                nextInt++
                color.green = parseInt(fileBytes[nextInt])
                nextInt++
                color.blue = parseInt(fileBytes[nextInt])
                nextInt++
                image.set(x, y, color)
            }
        }

        return image
    }

    private write = (image: MyImage, filePath: string): void => {
        let content: string = ''

        content += 'P3\n'
        content += `${image.getWidth()} ${image.getHeight()}\n255\n`

        for (let y: number = 0; y < image.getHeight(); ++y) {
            for (let x: number = 0; x < image.getWidth(); ++x) {
                const color: Color = image.get(x, y)
                content += `${x == 0 ? '' : ' '}${color.red} ${color.green} ${color.blue}`
            }
            content += '\n'
        }

        writeFileSync(filePath, content)
    }
}

class Color {
    public red: number
    public green: number
    public blue: number

    constructor() {
        this.red = 0
        this.green = 0
        this.blue = 0
    }
}

class MyImage {
    public pixels: Color[][]

    constructor(width: number, height: number) {
        this.pixels = Array.from( { length: width }, 
            () => Array.from( { length: height }, () => new Color())
        )
    }

    public getWidth = (): number => {
        return this.pixels.length
    }

    public getHeight = (): number => {
        return this.pixels[0].length
    }

    public set = (x: number, y: number, c: Color): void => {
        this.pixels[x][y] = c
    }

    public get = (x: number, y: number): Color => {
        return this.pixels[x][y]
    }
}

const editor: ImageEditor = new ImageEditor()
editor.run()
