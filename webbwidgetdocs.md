# Developer Guide for selling Web-Widgets on the App Marketplace

This guide aims to help developers create custom widgets for use in funnel builder and integrate them seamlessly. We will cover how to create, set up, and render custom widgets using HTML, CSS, and JavaScript or any JS frameworks like Angular, React, Vue along with communication between your custom widget application and the funnel builder.

## TABLE OF CONTENTS

**Prerequisites**
- Basic knowledge of HTML, CSS, JavaScript or Experience with JS frontend frameworks (Angular, React, Vue or similar)
- Familiarity with iFrames.
- Understanding of event-driven programming.

## Overview

Custom widgets allow you to extend functionalities of a funnel builder by embedding custom elements like price banners or other interactive components.

## Step-by-Step Guide

### Step 1: Register yourself as a developer on the App Marketplace

- Sign up as a developer on the App Marketplace.
- Click on 'Create App' and start your app creation journey.

### Step 2: Setting Up Your Custom Widget

**Create Your Application**

Develop an independent web application which allows users to interact with UI elements and generate HTML, CSS and JS (if required) which will render the custom widget element based on the settings that they choose.

- The application should have the following functions which emits HTML, CSS and JS
  - createHtml() => Returns the HTML code for the widget
  - createJS() => Returns the JS code required for the widget to run in the website (optional)
  - createCss() => Returns the css code required for the widget styles.
  - createHtml() => Returns the HTML code for the widget

The application should use postmate for iFrame communication between the funnel builder. The widget code can be emitted to the funnel builder via an event emit.

**Example:**
```javascript
parent?.emit('code', {
  html: html as string,
  js: js as string,
  elementStore: elementSettings as Object
})
```

**Parameters:**

**html** : HTML content required for widget to render along with styles

**Example:**
```html
<style>{Your styles goes here}</style>
<div class="hl-banner">{Your HTML content goes here}</div>
```

**js** : JS code required for the widget to run (optional)

Note: make sure you don't wrap your js code inside <script /> tag

Note: If its a JS based application then all the code required for interacting with the funnel/website popup, or other JS events specified in the upcoming sections should be included in the JS emitted to the parent

**elementStore**: All the variables that represents the settings of the widget (variable names can be anything of your preference)

**Example:**
```javascript
settings: {
  widgetHeight: number
  widgetWidth: number
  image: string
}
```

- On application initialization or the initial handshake, expect for the following payload
```javascript
{ elementStore: Object } // The elementStore which is emitted by your application while sending the code to parent. Use this to prefill settings which is already saved by user for your widget in the funnel builder.
```

and ensure that you emit the initial state of preview
```javascript
parent?.emit('code', {
  html: html as string,
  js: js as string,
  elementStore: elementSettings as Object
})
```

Note: ensure that you emit the initial state Make sure that the data received is filled to all the respective settings of your widgets so that we can show the previously saved values on revisits

### Step 3: Integrating With the Funnel Builder

1. **Upload to Marketplace**
   - Build the project and upload the HTML, CSS & JS file or dist folder as a zip to the marketplace app
   - Ensure it adheres to the platform's guidelines and submission requirements.

2. **Add Custom Widget to Funnel Elements**
   - Once approved and available in the marketplace, the funnel builder will list your widget under a "Custom Widgets" or similar section.
   - Users can install the custom widget from the marketplace.
   - Drag and Drop Widget to Funnel Builder

4. **Limited Settings Configuration**
   - Configure limited settings (like margin, padding, visibility, and custom classes) to be editable directly from the funnel builder's settings area.
   - Main widget settings should be configured through an external pop-up handled by your application.

5. **Render the Widget**
   - Ensure the funnel builder can render the widget by interpreting the generated HTML, CSS, and JavaScript.

### Step 4: Communication Between Application and Funnel Builder

**Using iFrames**
- Host(will take care of hosting) your settings application inside an iframe within the funnel builder.
- Make sure it generates and communicates HTML, CSS, and JS code as settings are adjusted.

### Step 5: Events and JS Integration

Custom widget events allow your custom widget to communicate with the funnel preview environment. This communication is for creating interactive web applications where actions in the widget can trigger responses in the funnel preview, resulting in a smoother and more integrated user experience.

**Key Concepts**
- **Event Emission**: Your custom widget can send out signals (events) when users interact with it, like clicking a button or changing a setting.
- **Event Handling**: The funnel preview listens for these signals and performs certain actions in response, like opening a popup or moving to the next step in a funnel.

**Events:**

1. **customWidgetOpenPopup**

   Description: This event triggers an action to open a popup on the preview side.

   **Example:**
   ```javascript
   var event = new Event('customWidgetOpenPopup');
   window.dispatchEvent(event)
   ```

2. **customWidgetGoToNextStep**

   Description: This event triggers an action to move to the next step/page in the funnel/website.

   **Example:**
   ```javascript
   var event = new Event('customWidgetGoToNextStGoToNextStep');
   window.dispatchEvent(event)
   ```

## Example: Marketing Price Banner Widget

github.com
https://github.com/b805rohit/marketing-price-banner

## A Checklist before submitting your widget app for review

When developing and integrating custom widgets into a funnel builder, it's crucial to ensure they function effectively without causing any disruptions or conflicts. Please test your app to ensure it meets the criteria mentioned in this checklist before submitting the app for review.

- Ensure it does not disrupt builder functionality: Verify that the widget integrates smoothly and does not interfere with the core functionalities of the funnel builder.
- Confirm it does not conflict with other elements: Ensure that your widget does not overlap or interfere with other elements already present in the builder, which could lead to visual or functional issues.
- Check for any external scripts: Be vigilant about any unintended external scripts being included with your widget, especially if it's not meant to have such inclusions. These could introduce security risks or functionality conflicts.
- Verify that it does not disrupt the white labeling process: If the application supports white labeling, ensure that the widget preserves this capability and does not inadvertently expose brand-specific details.
- Ensure app state remains consistent and persistent: Confirm that the widget maintains its state across various interactions and revisits, ensuring a consistent user experience.
- Check that the initial state is correctly displayed: On loading, the widget should accurately reflect the initial state as intended, displaying all predefined settings and configurations.
- Test all settings to ensure they function properly: Go through each configurable setting within the widget to verify they perform as expected, without bugs or unexpected behavior.

By carefully reviewing each of these points, you can assure the quality and reliability of your custom widgets in the funnel builder environment. This checklist serves as a quality assurance tool to catch potential issues before deployment.

Was this article helpful?

That's Great!

Thank you for your feedback

Sorry! We couldn't be helpful

Thank you for your feedback

Feedback sent

We appreciate your effort and will try to fix the article