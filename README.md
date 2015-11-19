# JSequencer
### Motivation
like anonymous functions, but hate deep nested callbacks ?! here where JSequencer fit

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
you want to call all of this call backs in sequence, one after other completed in neat way, you may want to write

```javascript
var a = getData();
var b = getMoreData(a);
var c = getMoreData(b);
var d = getMoreData(c);
var e = getMoreData(d);
.....
```

but if those functions are async ajax calls, this flow will terminate before the first function is completed.

Now, imagin if you can just write it in sequence, but still run as callback, thats what JSequencer do

```javascript
var sequencer = new JSequencer.Sequencer()
.add(function (x) {
	return x * 100;
})
.add(function (x) {
	return x - 50;
})
.add(function (x, context) {
    context.pause();
    $('#resume').click(function () {
        context.resume(x + 100);
    });
})
.add(function (x) {
    return x / 5;
})
.add(function (x) {
    return x + 100;
})
.add(function (x, context) {
    context.pause();
    $('#resume').click(function () {
        context.resume(x + 20);
    });
})
.onStep(function (context) { console.log('step executed'); })
.onPaused(function (context) { console.log('paused'); })
.onResumed(function (context) { console.log('resumed'); })
.onCompleted(function (context, x) {
	console.log('finished');
	result = x;
	console.log(result);
	done();
})
.context();

sequencer.start(1);
		
```

in this code, sequencer manages to call functions in sequence, pauses when need to wait for an async operation (user clicks button), then resume flow afterwards

### Features

you can hook into execution flow, by methods like
```
onStep(callback); \\ called after a step is executed
onPaused(callback); \\ called after flow is paused
onResumed(callback); \\ called after flow is resumed
onError(callback); \\ called after a step fails in exception, enable to continue, or terminate
onFailed(callback); \\ called after flow failed to complete
onCompleted(callback); \\ called after flow completed successfully
```

every function in the flow gets context object and the result of the last function executed, the context object can be used for data sharing across steps and used for controlling the flow by below methods
```javascript
context.pause(); //pauses the flow on the current step
context.resume(data); // resume the flow, passing result of current step
context.break(); //complete the current step, backout from the flow
context.getResults();// returns array contains the result of each executed step in order
```
