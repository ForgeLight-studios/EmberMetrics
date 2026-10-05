const express = require('express')
const app = express()
const {getHostIp} = require('./opModules/utils')
// functions for metrics gathering
const {getMetrics, setChildLength} = require('./opModules/metrics')
const {findDevice} = require('./opModules/device')
const {checkDeviceConsistency} = require('./opModules/deviceConsistency')
const cors = require('cors')
const port = 3000
const deviceRoutes = require('./routes/deviceRoutes')
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const {checkDevicePerm, getUserById} = require("./opModules/user");
const {getSession, cleanExpiredSessions} = require("./opModules/sessionUtils");


app.use(express.json())
app.use(cors({
    origin: "*",
    methods: ["GET", "HEAD", "OPTIONS", "POST","DELETE", "PATCH"],
}));

app.use('/devices', deviceRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes)

app.post('/validateSession', async (req, res) => {
    console.log('[ Server - /validateSession ] Starting route endpoint')
    const sessionId = req.body.sessionId;
    if (!sessionId) {
        console.log('[ Server - /validateSession ] Session ID missing from request')
        return res.status(400).send({success: false})
    }
    const session = await getSession(sessionId);
    console.log('[ Server - /validateSession ] user session found:', JSON.stringify(session, null, 2))
    if (!session) {
        console.log('[ Server - /validateSession ] no valid session with session id | session expired')
        return res.status(401).send({success: false})
    }
    console.log('session.userId:', JSON.stringify(session.userId))
    const response = await getUserById(session.userId);
    if (!response.user.active) return res.status(401).send({success: false})
    if (!response.success) return res.status(401).send({success: false})
    res.status(200).send({success: true, user: response.user})
});

app.post('/', async (req, res) => {
    const {device, childLength, user} = req.body
    if (!device || !childLength || !user) {
        console.log('[ Server - /getMetrics ] no device, childLength or user sent')
        return res.status(400).send({success: false})
    }

    const allowed = await checkDevicePerm(user.id, device.id)
    if (!allowed) {
        console.log('[ Server - /getMetrics ] User is not allowed ot access this device')
        return res.status(403).send({success: false})
    }

    const parsed = parseInt(childLength, 10)
    if (typeof parsed === 'number') {
        setChildLength(parsed);
    } else {
        console.log('[ Server - /getMetrics ] childLength is not a number')
        return res.status(400).send({success: false})
    }
    if (device.isHost) {
        //run locally if the device sent is the host device
        const metrics = getMetrics();
        if (metrics || (typeof metrics === 'object' && Object.keys(metrics).length !== 0)) {
            return res.status(200).json({
                metrics: metrics,
                success: true
            }); // always send JSON
        }
        console.log('[ Server - /getMetrics ] No metrics available')
        return res.status(404).send({success: false})
    }

    const found = await findDevice(device.id)
    if (!found.success) {
        console.log('[ Server - /getMetrics ] Device does not exist')
        return res.status(404).send({success: false})
    }

    try {
        const response = await fetch(`http://${device.ip}:3000`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                childLength: childLength
            })
        })
        const resData = await response.json()
        if (response.ok) {
            if (resData.success) {
                return res.status(200).send(resData)
            }
        } else if (response.statusCode !== 500) {
            console.log('[ Server - /getMetrics ] Device did not respond')
            return res.status(404).send({success: false, reason: 'no_response'})
        }
        console.log(`[ Server - /getMetrics ] Error from remote device ${resData.reason}`)
        return res.status(500).send({success: false})
    } catch (e) {
        console.log(`[ Server - /getMetrics ] Error gathering metrics: ${e}`)
        res.status(500).send({success: false})
    }
})

app.listen(port, async () => {
    console.log(`[Server] API Listening on port ${port}`)
    await getHostIp()
    //clean all expired sessions on start up
    cleanExpiredSessions()
// run every hour to clean expired sessions and ghost devices
    setInterval(cleanExpiredSessions, 60 * 60 * 1000);
    setInterval(checkDeviceConsistency, 60 * 60 * 1000);
})