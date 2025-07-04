import { h } from 'preact';
import 'ojs/ojbutton';

const Login = () => {
  const handleLogin = () => {
    console.log("inside login");
    const clientId = '858469888518-dhgoru9d7tes0kvs64corq7vqodh1ti9.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:3001/api/oauth/google';

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&access_type=offline`;

    window.location.href = oauthUrl;
  };

  return (
    <div
      class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center oj-sm-padding-6x"
      style="height: 100vh; background: linear-gradient(to right, #e6ebf1, #f9fafc);"
    >
      <div
        class="oj-panel oj-sm-padding-8x oj-sm-width-12 oj-md-width-8 oj-lg-width-6 oj-flex oj-sm-flex-direction-column oj-sm-align-items-center"
        style="border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); background-color: white;"
      >
        <h1 class="oj-typography-heading-xl oj-text-color-primary">
          <span style="color: red;">Go</span>Logs
        </h1>
        <p class="oj-typography-body-md oj-sm-margin-top-1x oj-text-color-secondary">
          Please sign in with your Google account
        </p>

        <oj-button
          class="oj-sm-margin-top-4x custom-red-button"
          chroming="solid"
          onojAction={handleLogin}
        >
          Login with Google
        </oj-button>
      </div>
    </div>
  );
};

export default Login;
