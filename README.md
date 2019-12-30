# iTunes Music Library Tracks
This module loops through iTunes Music Library XML and spits out a stream of JSON objects for each track.

## Motivation
There are similar npm modules that do this, however when trying to utilize them in an electron application they all failed in one way or another.
I created my module using minimal dependencies so that it works without issue.

This version works with stricter tslinting than versions by @johnpaulvaughan or @alexanderallen

## Installation
```bash
$ npm install @jcbrouwer/itunes-music-library-tracks --save
```

## Code Example
Supply the module with a path to your xml file. It returns a node readStream of tracks. <br>
It throws an error if something goes wrong.


```javascript
let getItunesTracks = require('itunes-music-library-tracks').getItunesTracks;
let validXMLpath = '/home/hans/Music/iTunes/iTunes Music Library.xml'

let trackStream = getItunesTracks(validXMLpath)

trackStream.on('data', function(track) {
    console.log(JSON.parse(track))
})

trackStream.on('error', function(err) {
    console.log(err)
})

trackStream.on('end', () => {
console.log('finished parsing xml stream')
})


```
