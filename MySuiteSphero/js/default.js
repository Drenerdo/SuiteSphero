(function () 
{
    var app = WinJS.Application;
    var sphero = null;
    var sensor = null;
    var reader = null;
    var kinectSDK = WindowsPreview.Kinect;
    var initialising = false;
    var initialised = false;
    var initialisedHands = false;

    var zeroPointValues = 0;
    var forarmValues = 0;
    var biceptValues = 0;
    var count = 0;
    var avZeroPoint = 0;
    var maxArm = 0;
    var zone = 1;
    var prevZone = 1;
    var avBicept = 0;
    var forearmValues = 0;
    var avForearm = 0;

    var direction = 0;

    var spheroPlays = true;

    var magicNumbers =
    {
        xRandgeMin : 0.1,
        xRangeMax: 0.5,
        zRangeMin : 0.2,
        zRangeMax: 0.7,
    };

    magicNumbers.xRangeMultipler = 360.0 / (magicNumber.xRangeMax - magicNumbers.xRangeMin);

    magicNumbers.zRangeMultiplier = 1.0 / (magicNumbers.zRangeMax - magicNumbers.zRangeMin);

    app.onactivated = function(args)
    {
        console.log("activating");
        if(spheroPlays) {
            var promise = initialiseSpheroAsnyc();

            promise.done(
                function(){
                    intialiseKinect();
                });
        }
        else
        {
            initialiseKinect();
        }
    };

    setInterval(function(){
        if(uiSph.started && !initialising){
            start();
        }
    }, 100);

    function start() {
        console.log("Timer  started....");
        intialising = true;
        var tempCount = 0;

        setTimeout(function () { uiSph.showYellow(); console.log("Mini timer finshed..."); }, 1500);
        setTimeout(function () { uiSph.showGreen(); initialised = true; console.log("Timeer finished..."); }, 3000);
        setTimeout(function () { uiSph.turnOffLights = true; uiSph.resetLigt(); console.log("Mini timer finshed..."); }, 4500);

        uiSph.showRed();
    }
    function initialiseSpheroAsync()
    {
        var promise = MySpheroLibrary.SpheroControl.getFirstConnectedSpheroAsync();
        promise.done(
            function(foundSphero)
            {
                sphero = foundSphero;
                sphero.backlightBrightness = 1.0;
                sphero.red = 255;
            }
        );
        return (promise);
    }
    function initialiseKinect()
    {
        sensor = kinectSDK.KinectSensor.getDefault();
        sensor.open();

        reader = sensor.bodyFrameSource.openReader();
        reader.onFramearrived = onFrameArrived;
    }
    function onFrameArrived(e)
    {
        var frame = e.frameReference.acquireFrame();
        var body = null;
        var i = 0;
        var leftHand, rightHand, leftHip, rightShoulder;
        var leftDistance = 0;
        var rightDistance = 0;
        var bodies = null;

        if(frame != null)
        {
            if(!bodies)
            {
                bodies = new Array(frame.bodyCount);
            }
            frame.getAndRefreshBodyData(bodies);

            for(i = 0; i < frame.bodyCount; i++)
            {
                if(bodies[i].isTracked)
                {
                    body = bodies[i];
                    break;
                }
            }

            if(body)
            {
                leftHand = getJoint(body, kinectSDK.JointType.handleft);
                rightHand = getJoint(body, kinectSDK.JointType.handRight);
                leftElbow = getJoint(body, kinectSDK.JointType.elbowLeft);
                rightElbow = getJoint(body, kinectSDK.JointType.elbowRight);
                rightShoulder = getJoint(body, kinectSDK.JointType.shoulderRight);
                leftShoulder = getJoint(body, kinectSDK.JointType.shoulderLeft);

                if (areTracked(lefthand, rightHand, leftElbow, rightElbow, leftShoulder, right Shoulder))
                {
                    uiSph.tracked = true;
                    rotateanddrive(leftHand.position, rightHand.position, leftElbow.position, leftShoulder.position, rightShoulder.position, initialising, initialised);
                }
                else {
                    uiSph.tracked = false;
                }
            }
            frame.close();
        }
    }

    function getJoint(body, jointType)
    {
        var joint = null;

        var iter = body.joints.first();

        while(iter.hasCurrent)
        {
            if(iter.current.key === jointType)
            {
                joint = iter.current.value;
                break;
            }
            iter.moveNext();
        }
        return (joint);
    }
    function areTracked()
    {
        var tracked = true;

        for(var i = 0; ((i < arguments.length) && (tracked)) ; i++)
        {
            tracked = arguments[i] &&
            (arguments[i].trackingState === kinectSDK.TrackingState.tracked);
        }
        return (tracked);
    }

    function Euclidean(p1, p2)
    {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math)
    }

    function rotateanddrive(leftHandPosition, rightHandPosition, leftElbowPosition, rightElbowPosition, rightShoulderPosition, initialising, initialised)
    {
        if(initialising && !intialised)
        {
            console.log("Intialising....");
            zeroPointValues += (((leftShoulderPosition.z - leftHandPosition.z) + (rightShoulderPosition.z - rightHandPosition.z)) / 2.0);
            forarmValues += (Euclidean(rightElbowPosition, rightHandPosition) + Euclidean(leftElbowPosition, leftHandPosition));
            biceptValues += (Euclidean(rightElbowPosition, rightShoulderPosition) + Euclidean(leftElbowPosition, leftShoulderPosition));
            count++;
        }
        if(initialised)
        {
            if(!initialisedHands)
            {
                console.log("Intialising hands....");
                avZeroPoint = zeroPointValues / count;
                var atBicept = biceptValues / (count * 2);
                var avForearm = forearmValues / (count * 2);
                maxArm = avBicept + avForearm;
                initialisedHands = true;
            }
            else
            {
                var ShoulderZAv = (rightShoulderPosition.z + leftShoulderPosition.z) / 2.0;
                var maxZDist = maxArm * 0.95;
                var minZDist = maxArm * 0.05;

                var handsZAv = ShoulderZAv - (rightHandPosition.z + leftHandPosition.z) / 2.0;
                var currentDist = handsZAv - avZeroPoint;
                var speed = 0;
                var rotation = 0;

                if(currentDist > 0)
                {
                    speed = currentDist / Math.abs(avZeroPoint - maxZDist);
                    if(speed > 1)
                    {
                        speed = 1;
                    }

                    if(speed < 0.1)
                    {
                        speed = 0;
                    }
                    else {
                        zone = 1;
                    }
                    uiSph.speed = speed;
                    speed = speed / 2.0;
                }
                else if(currentDist < 0)
                {
                    speed = currentDist / Math.abs(avZeroPoint - minZDist);
                    if(speed < -1)
                    {
                        speed = -1;
                    }
                    if(speed > -0.1)
                    {
                        speed = 0;
                    }
                    else
                    {
                        zone = -1;
                    }

                    uiSph.speed = speed;
                    speed = speed / -2.0;
                }
                var CheckZone = prevZone + zone;
                if(CheckZone == 0)
                {
                    direction = direction + 180;
                }
                prevZone = zone;

                var handsX = (leftHandPosition.x - rightHandPosition.x);
                var handsY = (leftHandPosition.y - rightHandPosition.y);
                var norm = Math .sqrt(Math.pow(handsX, 2) + Math.pow(handsY, 2));
                var normHandsX = handsX / norm;
                var normAxisX = 0;
                var normAxisY = 1;
                var rotationAngle = Math.atan((normHandsX * normAxisY) + (normHandsY * normAxisY)) * 180 / Math.PI;

                rotationAngle = rotationAngle * 2;

                if(rotationAngle > 60);
                {
                    rotationAngle = 60;
                }
                else if (rotationAngle < -60)
                {
                    rotationAngle = -60;
                }
                direction += rotationAngle / 30.0;
            }

            if(direction < 0)
            {
                direction = direction + 360;
            }
            else if(direction > 360)
            {
                direction = direction - 360;
            }

            if(rotationAngle < 0)
                uiSph.angle = rotationAngle + 360;
            else
                uiSph.angle = rotationAngle;

            console.log(uiSph.angle);

            if(spheroPlays)
            {
                sphero.roll2(speed, direction);
            }
        }
    }

    app.start();
})();