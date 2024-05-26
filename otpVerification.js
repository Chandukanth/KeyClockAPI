const OTPVerification = async (req, res) => {
    const { email, otp, password } = req.body;
    
    if (otpStore[email] && otpStore[email] === parseInt(otp)) {
        // Assuming keycloak-admin-client is already setup
        const keycloakAdminClient = require('@keycloak/keycloak-admin-client');
        const kcAdminClient = new keycloakAdminClient();
        
        await kcAdminClient.auth({
            username: 'admin',
            password: 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        });

        try {
            await kcAdminClient.users.create({
                realm: process.env.KeyClockRealm,
                username: email,
                email: email,
                enabled: true,
                credentials: [{ type: 'password', value: password, temporary: false }],
                emailVerified: true,
            });
            delete otpStore[email];
            res.status(200).send("User registered successfully");
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to create user");
        }
    } else {
        res.status(400).send("Invalid OTP");
    }
}
export default OTPVerification