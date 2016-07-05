# watchmen-plugin-twilio

Plugin for Watchmen to send notifications to SMS via Twilio

## Installation

1. Install Watchmen: [follow instructions](https://github.com/iloire/watchmen#installation)

2. Install the plugin:

`npm install watchmen-plugin-twilio`

## Configuration

Add your Twilio account via environment variables:

```
export WATCHMEN_AUTH_TWILIO_SID='<your-twillio-sid>'
export WATCHMEN_AUTH_TWILIO_AUTH_TOKEN='<your-twillio-auth-token>'
export WATCHMEN_AUTH_TWILIO_PHONE_NUMBER='<your-twillio-phone-number>'
```


You should be able to find this information on Twilio as follows:
- SID and Auth Token at this link: https://www.twilio.com/console/account/settings
- phone numbers should be listed here: https://www.twilio.com/console/phone-numbers/dashboard


## Usage

Edit/create a service and fill out the new field "Alert to phone numbers" (supports multiple comma-separated phone numbers).