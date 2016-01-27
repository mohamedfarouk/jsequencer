# JSequencer
### Motivation
imagin having large number of call backs in sequence, somthing like

```javascript
getData(function(a){  
    getMoreData(a, function(b){
        getMoreData(b, function(c){ 
            getMoreData(c, function(d){ 
                getMoreData(d, function(e){ 
                    ...
                });
            });
        });
    });
});
```
how about running this as a sequence
```javascript
var a = getData();
var b = getMoreData(a);
var c = getMoreData(b);
var d = getMoreData(c);
var e = getMoreData(d);
```
more readable, right ??

But for async operations, this is not practical, need some sort of sequencing 
, and this what <b>JSequncer</b> does

check below example
```javascript
$(document).ready(function () {
    var result = 1;
    var sequencer = new JSequencer.Sequencer()
    .add(function () {
        return result * 100;
    })
    .add(function () {
        return result - 50;
    })
    .add(function (context) {
        context.pause();
        console.log('paused');
        $('#resume').click(function () {
            context.resume(result + 100);
        });
    })
    .add(function () {
        return result / 5;
    })
    .while(function () {
        return result < 50;
    })
    .do(function () {
        result = result + 1
    })
    .if(function () {
        return result > 50;
    })
    .then(function () {
        result = result + 1;
    })
    .elseif(function () {
        return result < 50;
    }, function () {
        result = result + 1;
    })
    .else(function () {
        result = result + 1;
    })
    .endif()
    .onStep(function (context) { console.log('on step executed'); })
    .onPaused(function (context) { console.log('on pause'); })
    .onResumed(function (context) { console.log('on resume'); })
    .onCompleted(function (context) {
        console.log('on finished');
        console.log(result);
    })
    .context();

    sequencer.start();
});
```

in previous code block

* create object of JSequencer
* use <code>sequencer.add(callback)</code> to register step in the sequence
* use <code>sequencer.while(predicate).do(callback)</code> to run step in a loop
* use <code>sequencer.if(predicate).then(callback).else(callback).endif()</code> to make conditional flow
* each callback function is passed context object as first parameter, and previous step result as second patameter

### Features

- <b>support for async operations</b>
``` javascript
var result = 1;
var sequencer = new JSequencer.Sequencer()
.add(function () {
    return result * 100;
})
.add(function () {
    return result - 50;
})
.add(function (context) {
    context.pause();
    console.log('paused');
    $('#resume').click(function () {
        context.resume(result + 100);
    });
})
.onCompleted(function (context) {
    console.log('on finished');
    console.log(result);
})
.context();
 sequencer.start();
```
just with a call to <code>context.pause()</code> instructs the sequencer to pause, then in callback, just call <code>context.resume('return value')</code> to resume the sequence , passing your return value
*****
- <b>Ability to build logical sequence using</b>
``` javascript
sequencer.if(predicate)
.then(thenBody)
.elseif(predicate, thenBody)
.elseif(predicate, thenBody)
.elseif(predicate, thenBody)
.elseif(predicate, thenBody)
...
...
.else(finalElseBody)
.endif() //end if block
```
*****
- <b>Ability to build while loops like</b>
```
sequencer.while(predicate)
.do(whileBody)
```
*****
- <b>Also you can hook into execution flow, by methods like</b>
```
onStep(callback); \\ called after a step is executed
onPaused(callback); \\ called after flow is paused
onResumed(callback); \\ called after flow is resumed
onError(callback); \\ called after a step fails in exception, enable to continue, or terminate
onFailed(callback); \\ called after flow failed to complete
onCompleted(callback); \\ called after flow completed successfully
```
*****
- <b>control over workflow using context parameter passed to every step</b>
```javascript
context.pause(); //pauses the flow on the current step
context.resume(data); // resume the flow, passing result of current step
context.break(); //complete the current step, backout from the flow
context.getResults();// returns array contains the result of each executed step in order
context.set('key', value);// set / updates a value to be read by subsquent steps
context.get('key');// get values stored in execution context by previous steps
```


