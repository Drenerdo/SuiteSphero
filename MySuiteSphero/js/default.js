(function () {
    "use struct";

    var app = WinJS.Application;
    var sphero = null;
    var sensor = null;
    var reader = null;
    var kinectSDK = WindowsPreview.Kinect;
    var magicNumbers =
        {
            xRangeMin: 0.1,
            xRangeMax: 0.5,
            zRangeMin: 0.2,
            zRangeMax: 0.7,
        };

    magicNumbers.xRangeMultipler = 360.0 / (magicNumbers.xRangeMax - magicNumbers.xRangeMin);

    magicNumbers.zRangeMultiplier = 1.0 / (magicNumbers.zRangeMax - magicNumbers.zRangeMin);

    app.onactivated = function (args) {
        var promise = initialiseSpheroAsync();

        promise.done(
            function () {
                initialiseKinect();
            });
    };

    function initialiseSpheroAsync()
    {
        var promise = MySuiteSphero.SpheroControl.getFirstConnectedSpheroAsync();
        promise.done(
            function (foundSphero) {
                sphero = foundSphero;
                sphero.backlightBrightness = 1.0;
                sphero.red = 255;
            }
           );
        return (promise);
    }
    function initialiseKinect() {
        sensor = KinectSDK.kinectSensor.getDefault();
        sensor.open();

        reader = sensor.bodyFrameSource.openReader();
        reader.onFramearrived = onFrameArrived;
    }

    function onFrameArrived(e) {
        var frame = e.frameReference.acquireFrame();
        var body = null;
        var i = 0;
        var leftHand, rightHand, leftHip, rightShoulder;
        var leftDistance = 0;
        var rightDistance = 0;
        var bodies = null;

        if (frame != null) {
            if (!bodies) {
                bodies = new Array(frame.bodyCount);
            }

            frame.getAndRefereshBodyData(bodies);

            for (i = 0; i < frame.bodyCount; i++) {
                if (bodies[i].isTracked) {
                    body = bodies[i];
                    break;
                }
            }

            if (body) {
                leftHand = getJoint(body, kinectSDK.JointType.handLeft);
                rightHand = getJoint(body, kinectSDK.JointType.handRight);
                leftHip = getJoint(body, KinectSDK.JointType.hipLeft);
                rightShoulder = getJoint(body, KinectSDK.JointType.shoulderRight);

                if (areTracked(leftHand, rightHand, leftHip, rightShoulder)) {
                    rotate(leftHand.position, leftHip.position);
                    drive(rightHand.position, rightShoulder.position);
                }
            }
            frame.close();
        }
    }

    function getJoint(body, jointType) {
        var joint = null;

        var iter = body.joints.first();

        while (iter.hasCurrent) {
            if (iter.current.key === jointType) {
                joint = iter.current.value;
                break;
            }
            iter.moveNext();
        }
        return (joint);
    }
    function areTracked() {
        var tracked = true;

        for (var i = 0; ((i < arguments.length) && (tracked)) ; i++) {
            tracked = arguments[i] &&
                (arguments[i].trackingState === kinectSDK.TrackingState.tracked);
        }
        return (tracked);
    }
    function rotate(leftHandPosition, leftHipPosition) {
        var xDistance = Math.abs(leftHandPosition.x - leftHipPosition.x);
        var clampedValue = 0;

        if ((xDistance >= magicNumbers.xRangeMin) && (xDistance <= magicNumbers.xRangeMax)) {
            clampedValue =
                (xDistance - magicNumbers.xRangeMin) * magicNumbers.xRangeMultipler;

            sphero.rotation = clampedValue;
        }
    }

    function drive(rightHandPosition, rightShoulderPosition) {
        var zDistance = Math.abs(rightHandPosition.z - rightShoulderPosition.z);
        var clampedValue = 0;

        if ((zDistance >= magicNumbers.zRangeMin) && (zDistance <= magicNumbers.zRangeMax)) {
            clampedValue =
                (zDistance - magicNumbers.zRangeMin) * magicNumbers.zRangeMultiplier;

            sphero.roll(clampedValue);
        }
    }

    app.start();

})();