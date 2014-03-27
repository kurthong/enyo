/**
	_enyo.Popup_ is a control used to display certain content on top of other
	content.

	Popups are initially hidden on creation; they can be shown by calling the
	_show_ method and re-hidden by calling _hide_.  Popups may be centered using
	the	_centered_ property; if not centered, they should be given a specific
	position.

	A popup may be optionally floated above all application content by setting
	its _floating_ property to _true_.  This has the advantage of guaranteeing
	that the popup will be displayed on top of other content.  This usage is
	appropriate when the popup does not need to scroll along with other content.

	For more information, see the documentation on
	[Popups](building-apps/controls/popups.html) in the Enyo Developer Guide.
 */
enyo.kind({
	name: "enyo.Popup",
	classes: "enyo-popup enyo-no-touch-action",
	published: {
		//* Set to true to prevent controls outside the popup from receiving
		//* events while the popup is showing
		modal: false,
		//* By default, the popup will hide when the user taps outside it or
		//* presses ESC.  Set to false to prevent this behavior.
		autoDismiss: true,
		//* Set to true to render the popup in a floating layer outside of other
		//* controls.  This can be used to guarantee that the popup will be
		//* shown on top of other controls.
		floating: false,
		//* Set to true to automatically center the popup in the middle of the viewport
		centered: false,
		//* Set to true to be able to show transition on the style modifications otherwise
		//* the transition is invisible (visibility: hidden)
		showTransitions: false,
		//* Set to true to stop preventDefault from being called on captured events
		allowDefault: false
	},
	//* @protected
	showing: false,
	handlers: {
		onkeydown: "keydown",
		ondragstart: "dragstart",
		onfocus: "focus",
		onblur: "blur",
		onRequestShow: "requestShow",
		onRequestHide: "requestHide"
	},
	captureEvents: true,
	eventsToCapture: { 
		ondown: "capturedDown", 
		ontap: "capturedTap" 
	},
	//* @public
	events: {
		//* Fires after the popup is shown.
		onShow: "",
		//* Fires after the popup is hidden.
		onHide: ""
	},
	//* @protected
	tools: [
		{kind: "Signals", onKeydown: "keydown"}
	],
	create: enyo.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.canGenerate = !this.floating;
		};
	}),
	render: enyo.inherit(function (sup) {
		return function() {
			if (this.floating) {
				if (!enyo.floatingLayer.hasNode()) {
					enyo.floatingLayer.render();
				}
				this.parentNode = enyo.floatingLayer.hasNode();
			}
			sup.apply(this, arguments);
		};
	}),
	destroy: enyo.inherit(function (sup) {
		return function() {
			this.release();
			sup.apply(this, arguments);
		};
	}),

	reflow: enyo.inherit(function (sup) {
		return function() {
			this.updatePosition();
			sup.apply(this, arguments);
		};
	}),
	calcViewportSize: function() {
		if (window.innerWidth) {
			return {
				width: window.innerWidth,
				height: window.innerHeight
			};
		} else {
			var e = document.documentElement;
			return {
				width: e.offsetWidth,
				height: e.offsetHeight
			};
		}
	},
	updatePosition: function() {
		var d = this.calcViewportSize();
		var b = this.getBounds();

		if (this.targetPosition) {
			// For brevity's sake...
			var p = this.targetPosition;

			// Test and optionally adjust our target bounds (only first is commented, because logic is effectively identical for all scenarios)
			if (typeof p.left === 'number') {
				// If popup will be outside window bounds, switch anchor
				if (p.left + b.width > d.width) {
					if (p.left - b.width >= 0) {
						// Switching to right corner will fit in window
						p.right = d.width - p.left;
					} else {
						// Neither corner will work; stick at side of window
						p.right = 0;
					}
					p.left = null;
				} else {
					p.right = null;
				}
			} else if (typeof p.right === 'number') {
				if (p.right + b.width > d.width) {
					if (p.right - b.width >= 0) {
						p.left = d.width - p.right;
					} else {
						p.left = 0;
					}
					p.right = null;
				} else {
					p.left = null;
				}
			}

			if (typeof p.top === 'number') {
				if (p.top + b.height > d.height) {
					if (p.top - b.height >= 0) {
						p.bottom = d.height - p.top;
					} else {
						p.bottom = 0;
					}
					p.top = null;
				} else {
					p.bottom = null;
				}
			} else if (typeof p.bottom === 'number') {
				if (p.bottom + b.height > d.height) {
					if (p.bottom - b.height >= 0) {
						p.top = d.height - p.bottom;
					} else {
						p.top = 0;
					}
					p.bottom = null;
				} else {
					p.top = null;
				}
			}

			// 'initial' values are necessary to override positioning rules in the CSS
			this.addStyles('left: ' + (p.left !== null ? p.left + 'px' : 'initial') + '; right: ' + (p.right !== null ? p.right + 'px' : 'initial') + '; top: ' + (p.top !== null ? p.top + 'px' : 'initial') + '; bottom: ' + (p.bottom !== null ? p.bottom + 'px' : 'initial') + ';');
		} else if (this.centered) {
			var o = this.getInstanceOwner().getBounds();
			this.addStyles( "top: " + Math.max( ( ( o.height - b.height ) / 2 ), 0 ) + "px; left: " + Math.max( ( ( o.width - b.width ) / 2 ), 0 ) + "px;" );
		}
	},
	showingChanged: enyo.inherit(function (sup) {
		return function() {
			// auto render when shown.
			if (this.floating && this.showing && !this.hasNode()) {
				this.render();
			}
			// hide while sizing, and move to top corner for accurate sizing
			if (this.centered || this.targetPosition) {
				if (!this.showTransitions) {
					this.applyStyle("visibility", "hidden");
				}
				this.addStyles("top: 0px; left: 0px; right: initial; bottom: initial;");
			}
			sup.apply(this, arguments);
			if (this.showing) {
				this.resized();
				if (this.captureEvents) {
					this.capture();
				}
			} else {
				if (this.captureEvents) {
					this.release();
				}
			}
			// show after sizing
			if (this.centered || this.targetPosition && !this.showTransitions) {
				this.applyStyle("visibility", null);
			}
			// events desired due to programmatic show/hide
			if (this.hasNode()) {
				this[this.showing ? "doShow" : "doHide"]();
			}
		};
	}),
	capture: function() {
		enyo.dispatcher.capture(this, this.eventsToCapture);
	},
	release: function() {
		enyo.dispatcher.release(this);
	},
	capturedDown: function(inSender, inEvent) {
		//record the down event to verify in tap
		this.downEvent = inEvent;

		// prevent focus from shifting outside the popup when modal.
		if (this.modal && !this.allowDefault) {
			inEvent.preventDefault();
		}
		return this.modal;
	},
	capturedTap: function(inSender, inEvent) {
		// dismiss on tap if property is set and click started & ended outside the popup
		if (this.autoDismiss && (!inEvent.dispatchTarget.isDescendantOf(this)) && this.downEvent &&
			(!this.downEvent.dispatchTarget.isDescendantOf(this))) {
			this.downEvent = null;
			this.hide();
		}
		return this.modal;
	},
	// if a drag event occurs outside a popup, hide
	dragstart: function(inSender, inEvent) {
		var inScope = (inEvent.dispatchTarget === this || inEvent.dispatchTarget.isDescendantOf(this));
		if (inSender.autoDismiss && !inScope) {
			inSender.setShowing(false);
		}
		return true;
	},
	keydown: function(inSender, inEvent) {
		if (this.showing && this.autoDismiss && inEvent.keyCode == 27 /* escape */) {
			this.hide();
		}
	},
	// If something inside the popup blurred, keep track of it.
	blur: function(inSender, inEvent) {
		if (inEvent.dispatchTarget.isDescendantOf(this)) {
			this.lastFocus = inEvent.originator;
		}
	},
	// When something outside the popup focuses (e.g., due to tab key), focus our last focused control.
	focus: function(inSender, inEvent) {
		var dt = inEvent.dispatchTarget;
		if (this.modal && !dt.isDescendantOf(this)) {
			if (dt.hasNode()) {
				dt.node.blur();
			}
			var n = (this.lastFocus && this.lastFocus.hasNode()) || this.hasNode();
			if (n) {
				n.focus();
			}
		}
	},
	requestShow: function() {
		this.show();
		return true;
	},
	requestHide: function() {
		this.hide();
		return true;
	},

	//* @public
	/**
		Open at the location of a mouse event (_inEvent_). The popup's
		position is automatically constrained so that it does not
		display outside the viewport, and defaults to anchoring the top
		left corner of the popup to the mouse event.

		_inOffset_ is an optional object which may contain left and top
		properties to specify an offset relative to the location the
		popup would otherwise be positioned.
	*/
	showAtEvent: function(inEvent, inOffset) {
		// Calculate our ideal target based on the event position and offset
		var p = {
			left: inEvent.centerX || inEvent.clientX || inEvent.pageX,
			top: inEvent.centerY || inEvent.clientY || inEvent.pageY
		};
		if (inOffset) {
			p.left += inOffset.left || 0;
			p.top += inOffset.top || 0;
		}

		this.showAtPosition(p);
	},

	/**
		Open the popup at a specific position. The final location
		of the popup will be automatically constrained so that it does not
		display outside the viewport.

		_inPosition_ is an object which may contain left, top, bottom,
		and right properties to specify where the popup will be anchored.
		If both left and right are included, the popup will preference left
		(same for top vs. bottom).
	*/
	showAtPosition: function(inPosition) {
		// Save our target position for later processing
		this.targetPosition = inPosition;

		// Show the dialog
		this.show();
	}
});
