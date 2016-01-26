# JSequencer
### Motivation
Get the power of workflows to javascript
imagine having a sequence of operations done in flow like

```javascript
function multiplyBy(mul){
    x = x * mul;
}
function add(plus){
    x = x + plus;
}

var x = 1;
multiplyBy(5);
add(2);
multiplyBy(10);
console.log(x); 
```
this is how you would do sequence operations in java script
#####what if one of the function is async ? this may result change.
#####what if some function should be run multiple times, or  conditionally ??

this what JSequencer do.

you want to call all of this call backs in sequence, one after other completed in neat way, you may want to write

```javascript
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
.onStep(function (context) { console.log('step executed'); })
.onPaused(function (context) { console.log('paused'); })
.onResumed(function (context) { console.log('resumed'); })
.onCompleted(function (context) {
	console.log('finished');
	console.log(result);
})
.context();

sequencer.start();
		
```

in this code, sequencer manages to call functions in sequence, pauses when needed to wait for an async operation (user clicks button), then resume flow afterwards

### Features
ability to build logical sequence using
```
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
ability to build while loops like
```
sequencer.while(predicate)
.do(whileBody)
```
also you can hook into execution flow, by methods like
```
onStep(callback); \\ called after a step is executed
onPaused(callback); \\ called after flow is paused
onResumed(callback); \\ called after flow is resumed
onError(callback); \\ called after a step fails in exception, enable to continue, or terminate
onFailed(callback); \\ called after flow failed to complete
onCompleted(callback); \\ called after flow completed successfully
```

every function in the flow gets context object and the result of the last function executed (as the last 2 arguments), the context object can be used for data sharing across steps and used for controlling the flow by below methods
```javascript
context.pause(); //pauses the flow on the current step
context.resume(data); // resume the flow, passing result of current step
context.break(); //complete the current step, backout from the flow
context.getResults();// returns array contains the result of each executed step in order
```


