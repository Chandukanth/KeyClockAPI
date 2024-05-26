const ResetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] && otpStore[email] === parseInt(otp)) {
        const keycloakAdminClient = require('@keycloak/keycloak-admin-client');
        const kcAdminClient = new keycloakAdminClient();

        await kcAdminClient.auth({
            username: 'admin',
            password: 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        });

        try {
            const users = await kcAdminClient.users.find({ realm: process.env.KeyClockRealm, email: email });
            if (users.length === 1) {
                await kcAdminClient.users.resetPassword({
                    realm: process.env.KeyClockRealm,
                    id: users[0].id,
                    credential: { type: 'password', value: newPassword, temporary: false }
                });
                delete otpStore[email]; // Clean up OTP
                res.status(200).send("Password reset successfully");
            } else {
                res.status(404).send("User not found");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to reset password");
        }
    } else {
        res.status(400).send("Invalid OTP");
    }
}
export default ResetPassword