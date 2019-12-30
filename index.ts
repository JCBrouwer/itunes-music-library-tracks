import * as path from 'path'
import * as fs from 'fs'
import { Readable } from 'stream'
const byline = require('byline')

/**
 * Creates an stream of JSON tracks from an iTunes Library XML file.
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */
export function getItunesTracks(librarypath: fs.PathLike) {

	let libraryID: string
	let trackObj: any = {}
	let line: any
	let trackCount: number = 0

	let streamIn: any
	let streamOut: Readable = new Readable
	streamOut._read = function () { /* needed this stub to fix init issues */ }

	streamIn = fs.createReadStream(librarypath)
	streamIn.on('error', () => streamOut.emit("error", 'The file you selected does not exist'))
	streamIn = byline.createStream(streamIn)

	streamIn.on('readable', () => {
		while (null !== (line = streamIn.read())) {
			if (line.indexOf("<key>Library Persistent ID</key>") > -1) {
				/* ADD A KEY/VALUE PROPERTY */
				let iDString = String(line).match("<key>Library Persistent ID</key><string>(.*)</string>")
				if (Boolean(iDString)) {
					libraryID = iDString![1]
				}
				else {
					throw Error("Library Persistent ID string is null!")
				}
			}
			else if (line.indexOf("<dict>") > -1) {
				/* START A NEW TRACK */
				trackObj = {}
			} else if (line.indexOf("<key>") > -1) {
				/* ADD A PROPERTY TO THE TRACK */
				Object.assign(trackObj, module.exports.buildProperty(line));
			} else if (line.indexOf("</dict>") > -1) {
				/* END OF CURRENT TRACK */
				if (module.exports.objectIsMusicTrack(trackObj)) {
					trackObj['Library Persistent ID'] = libraryID //add extra metadata
					trackCount++
					streamOut.push(JSON.stringify(trackObj))
				}
			}
		}
	})

	streamIn.on('end', () => {
		if (trackCount == 0) streamOut.emit("error", 'No tracks exist in the file')
		trackCount = 0 //reset it
		streamOut.push(null)

	})

	streamIn.on('error', (err: any) => {
		console.warn(err);
		streamOut.emit("error", 'Error parsing iTunes XML')
	})

	return streamOut
}

/**
 * Validates that the file is an itunes XML file.
 *
 * @param  string
 * @return Boolean
 */
export function validPath(librarypath: any) {
	let extension = path.extname(librarypath)
	if (extension != '.xml') return false
	return true
}

/**
 * Ensures we have a music track and not a video or other non-music item.
 *
 * @param  Object
 * @return Boolean
 */
export function objectIsMusicTrack(obj: any) {
	if (
		(obj.Name || obj.Artist)
		&& !obj['Playlist ID']
		&& (obj.Kind ==
			(
				'MPEG audio file'
				|| 'AAC audio file'
				|| 'Matched AAC audio file'
				|| 'Protected AAC audio file'
				|| 'Purchased AAC audio file'
			)
		)
	) return true
	else return false
}

/**
 * Creates a simple object with a key/value pair from the current XML line.
 *
 * @param  String
 * @return Object
 */
export function buildProperty(line: any) {
	let key = String(line).match("<key>(.*)</key>")
	let value = String(line).match("<integer>(.*)</integer>")
	if (!value) value = String(line).match("<date>(.*)</date>")
	if (!value) value = String(line).match("<string>(.*)</string>")

	let k = ''
	if (key != null && key.length > 1) k = key[1]
	let v = ''
	if (value != null && value.length > 1) v = value[1]
	let o: any = {}
	o[k] = v
	return o
}
