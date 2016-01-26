/**
 * jSequencer v1.0.0 - 2016-01-26
 * 
 *
 * Copyright (c) 2016 Mohamed Farouk <mohammed.farouk@hotmail.com>
 * Licensed MIT
 */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports'], function(exports) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global Backbone.
			root.JSequencer = factory(root, exports);
		});
	} 
	else if (typeof exports !== 'undefined') {
		// Next for Node.js or CommonJS. jQuery may not be needed as a module.
		factory(root, exports);
	} 
	else {
		// Finally, as a browser global.
		root.JSequencer = factory(root, {});
	}

}(this, function(root, JSequencer){

    // Save the previous value of the `JSequencer` variable, so that it can be
	// restored later on, if `noConflict` is used.
	var previousJSequencer = root.JSequencer;
	
	// Current version of the library. Keep in sync with `package.json`.
	JSequencer.VERSION = '1.0.0';
	
	// Runs JSequencer.js in *noConflict* mode, returning the `JSequencer` variable
	// to its previous owner. Returns a reference to this JSequencer object.
	JSequencer.noConflict = function() {
		root.JSequencer = previousJSequencer;
		return this;
	};

	//constant states
	var STAT_NOT_STARTED = JSequencer.STAT_NOT_STARTED = "NOT_STARTED";
	var STAT_EXECUTING = JSequencer.STAT_EXECUTING = "EXECUTING";
	var STAT_STEP_EXECUTED = JSequencer.STAT_STEP_EXECUTED = "STEP_EXECUTED";
	var STAT_ERROR = JSequencer.STAT_ERROR = "ERROR";
	var STAT_PAUSED = JSequencer.STAT_PAUSED = "PAUSED";
	var STAT_RESUMED = JSequencer.STAT_RESUMED = "RESUMED";
	var STAT_COMPLETED = JSequencer.STAT_COMPLETED = "COMPLETED";
	var STAT_BREAK = JSequencer.STAT_FAILED = "BREAK";
	var STAT_FAILED = JSequencer.STAT_FAILED = "FAILED";
	
	function ExecutionContext(funcTable, resumeOnError, stateChangeCallback) {
	    var state = STAT_NOT_STARTED;
	    var currentStepIndex;
	    var results = [];
	    var context = {};

	    function runSingleStep(stepIndex, lastResult) {

	        //each call back is added as object like 
	        /*
             {
                func: function to call,
                context: function this object,
                params: function params (could be array or another func and will use the same context)
             }
             // each func will be passed execution context
             */
	        var context = funcTable[stepIndex].context;
	        var func = funcTable[stepIndex].func;
	        var params = funcTable[stepIndex].params;
	        if (typeof params === "function") {
	            params = params.call(context);
	        }
	        if (params === undefined) {
	            params = [];
	        }
	        if (!(params instanceof Array)) {
	            params = [params];
	        }
	        params.push(this);//add context to params
	        params.push(lastResult);// add last result

	        setState.call(this, STAT_EXECUTING, currentStepIndex);
	        var result = func.apply(context, params);
	        return result;
	    }

	    function runSequence(resumeIndex, lastResult) {
	        currentStepIndex = resumeIndex;
	        var returnVal;
	        try {
	            returnVal = runSingleStep.call(this, currentStepIndex, lastResult);
	        }
	        catch (ex) {
	            results[currentStepIndex] = undefined;
	            setState.call(this, STAT_ERROR, currentStepIndex, ex, lastResult);
	        }

	        if (state === STAT_BREAK) {
	            results[currentStepIndex] = returnVal;
	            setState.call(this, STAT_COMPLETED, currentStepIndex, returnVal);
	        }
	        else if (state !== STAT_PAUSED) {
	            results[currentStepIndex] = returnVal;
	            stateChangeCallback.call(this, STAT_STEP_EXECUTED, returnVal);

	            if (currentStepIndex >= funcTable.length - 1) {
	                setState.call(this, STAT_COMPLETED, currentStepIndex, returnVal);
	                return;
	            }
	            else {
	                currentStepIndex++;
	                runSequence.call(this, currentStepIndex, returnVal);
	            }
	        }
	    }

	    function setState(newState) {
	        state = newState;
	        stateChangeCallback.apply(this, arguments);
	    }

	    this.start = function (inArguments) {
	        currentStepIndex = 0;
	        runSequence.call(this, currentStepIndex, inArguments);
	    };

	    this.pause = function () {
	        if (state !== STAT_EXECUTING) {
	            throw "cannot call pause unless state is " + STAT_EXECUTING + " current state is " + state;
	        }
	        setState.call(this, STAT_PAUSED, currentStepIndex);
	    };

	    this.resume = function (lastResult) {
	        if (state !== STAT_PAUSED && state !== STAT_ERROR) {
	            throw "cannot call resume unless state is " + STAT_PAUSED + "or " + STAT_ERROR + " current state is " + state;
	        }
	        setState.call(this, STAT_RESUMED, currentStepIndex);
	        results[currentStepIndex] = lastResult;
	        stateChangeCallback.call(this, STAT_STEP_EXECUTED, currentStepIndex, lastResult);

	        if (currentStepIndex >= funcTable.length - 1) {
	            setState.call(this, STAT_COMPLETED, currentStepIndex, lastResult);
	            return;
	        }
	        else {
	            currentStepIndex++;
	            runSequence.call(this, currentStepIndex, lastResult);
	        }
	    };

	    this.break = function (lastResult) {
	        if (state !== STAT_EXECUTING && state !== STAT_PAUSED) {
	            throw "cannot call pause unless state is " + STAT_EXECUTING + " or " + STAT_PAUSED + " current state is " + state;
	        }
	        setState.call(this, STAT_BREAK, currentStepIndex, lastResult);
	        return;
	    };

	    this.getCurrentStep = function () {
	        return currentStepIndex;
	    };

	    this.getResults = function () {
	        // create copy of results array
	        var newResults = [];
	        for (var i in results) {
	            newResults.push(results[i]);
	        }
	        return newResults;
	    };

	    this.set = function (key, val) {
	        context[key] = val;
	    };

        this.get = function (key) {
            return context[key];
        };

        this.state = function () {
            return state;
        };
	}

	function IfBuilder(thisContext, sequencer, predicate) {

	    var elsed = false;
	    var pathSelected = false;
	    
	    function predicateWrapper(predicate, execContext) {
	        if (pathSelected === false) {
	            return predicate.call(this, execContext);
	        }
	    }

	    function thenWrapper(clause, execContext, predicateResult) {
	        if (pathSelected === false) {
	            if (predicateResult) {
	                pathSelected = true;
	                clause.call(this, execContext);
	            }
	        }
	    }

	    function elseWrapper(clause, execContext) {
	        if (pathSelected === false) {
	            pathSelected = true;
	            clause.call(this, execContext);
	        }
	    }

	    sequencer.add(predicateWrapper, thisContext, [predicate]);

	    this.then = function (thenClause) {
	        if (elsed === true) {
	            throw "final else already called, only endif function could be called";
	        }
	        sequencer.add(thenWrapper, thisContext, [thenClause]);
	        return this;
	    };

	    this.elseif = function (predicate, thenClause) {
	        if (elsed === true) {
	            throw "final else already called, only endif function could be called";
	        }
	        sequencer.add(predicateWrapper, thisContext, [predicate]);
	        sequencer.add(thenWrapper, thisContext, [thenClause]);
	        return this;
	    };

	    this.else = function (elseFunc) {
	        elsed = true;
	        sequencer.add(elseWrapper, thisContext, [elseFunc]);
	        return this;
	    };

	    this.endif = function () {
	        return sequencer;
	    };
	}

	function WhileBuilder(thisContext, sequencer, funcTable, predicate) {

	    var predicateIndex = funcTable.length;
	    var whileBody = null;

	    function predicateWrapper(predicate, execContext) {
	        return predicate.call(this, execContext);
	    }

	    function doWrapper(clause, execContext, predicateResult) {
	        if (predicateResult) {
	            var predicateFunc = {
	                context: thisContext,
	                params: [predicate],
	                func: predicateWrapper
	            };
	            var doClauseFunc = {
	                context: thisContext,
	                params: [whileBody],
	                func: doWrapper
	            };
	            // if predicated evaluated to true, record the predicate,and do warpper 
	            predicateIndex = predicateIndex + 2;
                //inject them again for re-run them again
	            funcTable.splice(predicateIndex, 0, predicateFunc, doClauseFunc);

	            clause.call(this, execContext);
	        }
	    }

	    sequencer.add(predicateWrapper, thisContext, [predicate]);

	    this.do = function (doClause) {
	        whileBody = doClause;
	        sequencer.add(doWrapper, thisContext, [whileBody]);
	        return sequencer;
	    };
	}

	JSequencer.Sequencer = function(options) {
		var funcTable = [];

		var stepCallback, stepContext;
		var completedCallback, completedContext;
		var breakCallback, breakContext;
		var errorCallback, errorContext;
		var failedCallback, failedContext;
		var pausedCallback, pausedContext;
		var resumedCallback, resumedContext;

		if (options.defaultContext === undefined || options.defaultContext === null){
			options.defaultContext = this;
		}
		if (options.resumeOnError === undefined || options.resumeOnError === null){
			options.resumeOnError = false;
		}
		var executionContext = null;

		function stateChanged(state, stepIndex) {
			// this function executed with this = ExecutionContext object
			if (state === STAT_COMPLETED) {
				if (typeof completedCallback === "function"){
				    completedCallback.call(completedContext, this, arguments[2]);
				}
			}
			if (state === STAT_BREAK) {
			    if (typeof breakCallback === "function") {
			        breakCallback.call(breakContext, this, arguments[2]);
			    }
			}
			else if (state === STAT_STEP_EXECUTED) {
				if (typeof stepCallback === "function"){
					stepCallback.call(stepContext, this);
				}
			}
			else if (state === STAT_PAUSED) {
				if (typeof pausedCallback === "function"){
					pausedCallback.call(pausedContext, this);
				}
			}
			else if (state === STAT_FAILED) {
			    if (typeof failedCallback === "function") {
			        var args = { stepIndex: stepIndex, error: arguments[2], lastResult: arguments[3]};
			        failedCallback.call(failedContext, this, args);
				}
			}
			else if (state === STAT_ERROR) {
			    var args = { stepIndex: stepIndex, resume: options.resumeOnError, error: arguments[2], lastResult: arguments[3], newResult: undefined };
				if (typeof errorCallback === "function") {
				    errorCallback.call(errorContext, this, args);
				}
				if (args.resume) {
				    var validResult = args.newResult === undefined ? args.lastResult : args.newResult;
				    this.resume(validResult);
				}
				else{
				    stateChanged.call(this, STAT_FAILED, stepIndex, arguments[2], arguments[3]);
				}
			}
			else if (state === STAT_RESUMED) {
				if (typeof resumedCallback === "function") {
					resumedCallback.call(resumedContext, this);
				}
			}
		}

		executionContext = new ExecutionContext(funcTable, options.resumeOnError, stateChanged);


		//each call back is added as object like 
		/*
		 {
			func: function to call,
			context: functions' this object,
			params: functions' params (could be array or another func and will use the same context)
		 }
		 // each func will be passed execution context
		 */
		this.add = function (func, context, params) {
			if (typeof func === "object" && arguments.length > 1){
				throw "parameters can be either passed as single object or arguments, not both";
			}
			if (typeof func === "object") {
				context = func.context;
				params = func.params;
				func = func.func;
			}
			if (context === null || context === undefined){
				context = options.defaultContext;
			}
			if (params === null || params === undefined){
				params = [];
			}
			funcTable.push({
				context: context,
				params: params,
				func: func
			});

			return this;
		};

		this.if = function (predicate, context) {
		    return new IfBuilder(context, this, predicate);
		};

		this.while = function (predicate, context) {
		    return new WhileBuilder(context, this, funcTable, predicate);
		};

		this.onStep = function (callback, context) {
			stepCallback = callback;
			stepContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onCompleted = function (callback, context) {
			completedCallback = callback;
			completedContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onError = function (callback, context) {
			errorCallback = callback;
			errorContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onFailed = function (callback, context) {
			failedCallback = callback;
			failedContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onPaused = function (callback, context) {
			pausedCallback = callback;
			pausedContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onResumed = function (callback, context) {
			resumedCallback = callback;
			resumedContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		};

		this.onBreak = function (callback, context) {
		    breakCallback = callback;
		    breakContext = (context === undefined || context === null) ? options.defaultContext : context;
		    return this;
		};

		this.context = function () {
			return executionContext;
		};
	};
	return JSequencer;
}));