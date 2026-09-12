export interface FaqQuestion {
  id: number;
  question: string;
  steps: string[];
}

export const FAQ_QUESTIONS: FaqQuestion[] = [
  {
    id: 1,
    question:
      "Are two different Twilio numbers required if user has subscription to both Performance and RTS Checkout?",
    steps: ["No, one Twilio number works for both the applications."],
  },
  {
    id: 2,
    question:
      "Do the same credentials work for both - Performance & RTS Checkout?",
    steps: [
      "Yes, credentials remain the same for all users - DSP Owner and Admins across both platforms.",
    ],
  },
  {
    id: 3,
    question: "How can Vehicle Assignment be done manually?",
    steps: [
      "Login to the application.",
      "Go to the Inspection View page.",
      "Select the driver from the list.",
      "Enter the number of vehicles to be dispatched and hit Submit.",
      "In the list below, select the Driver for respective vehicle numbers and enter the CX No, Staging Location, Stops, Packages, and Estimated time of return.",
      "Once all details are entered, select the checkbox — this saves the entered data for every vehicle.",
      "A message can be sent out to the drivers by clicking on the message icon next to the checkbox.",
      "Repeat the above steps for all vehicles that are to be dispatched.",
    ],
  },
  {
    id: 4,
    question:
      "What is the difference between Driver Return and Vehicle Inspection?",
    steps: [
      "Driver Return Inspection is done once the drivers return to the station after delivering packages. This is for the vehicles that were assigned in the morning during loadout.",
      "Vehicle Inspection can be done for any vehicle without assigning a driver. Vehicle inspection can be used as an audit process for vehicles weekly or biweekly.",
    ],
  },
  {
    id: 5,
    question: "Can a user add custom questions for inspections?",
    steps: [
      "Yes, a user can add custom questions from the Edit Inspection page.",
      "There is a plus sign card at the bottom of the page, where a user can enter the parameter name for inspection and enter the label under which it will be visible on the reports page.",
      "From the options on the left, a user can choose whether the answer will be captured via a picture, yes/no, numerical, or text field.",
    ],
  },
  {
    id: 6,
    question: "How can Preventive Maintenances be added to the app?",
    steps: [
      "Login to the application.",
      "Go to the Vehicles page.",
      "Select the vehicle for which PM needs to be added.",
      "Enter the Miles at which the last PM was done.",
      "Enter the Name of the vendor and any notes if needed.",
      "Upload the PM report.",
      "Once the vehicle is due within 1,000 miles for PM, an alert will be automatically generated on the dashboard.",
    ],
  },
  {
    id: 7,
    question: "How can I add Body Damages?",
    steps: [
      "Body Damages can be added in two ways: while completing the inspection, and via the Body Damage section from the Vehicles page.",
      "Method 1 (Web Application): Go to the Vehicles page, select the vehicle, navigate to the Body Damage section on the right, select the damage area from the dropdown, optionally add driver name and upload incident reports, and click Submit.",
      "Method 2 (Mobile App): While completing the inspection via the mobile app, tap the option to add Damage on the Front, Rear, Driver's Side, or Passenger's Side, and capture pictures directly with your device camera.",
    ],
  },
  {
    id: 8,
    question: "How can I add Mechanical Issues?",
    steps: [
      "Go to the Vehicles page.",
      "Select the particular vehicle for which the issue needs to be added.",
      "Select the Mechanical Issue section from the right side of the page.",
      "If you have pictures saved, upload them via the web application. Otherwise, capture pictures via the mobile app.",
      "Select the Issue from the dropdown list.",
      "If you want to add an issue outside the list, specify it in the 'Others' section.",
      "Users can also upload incident reports for any issue they want to document.",
      "Click Submit.",
    ],
  },
  {
    id: 9,
    question: "What are the steps for Driver Return Inspection?",
    steps: [
      "Login to the application.",
      "Click on Inspections from the navigation.",
      "Enter the number of vehicles dispatched.",
      "Assign Drivers to vehicles and fill in details (CX No, Stops, Estimated Return Time).",
      "Once vehicles return, inspection is done via the mobile app: sign in, select Driver Return Inspection, tap Inspect, answer inspection questions, take pictures, add comments, and hit Submit Inspection.",
      "Once completed for all vehicles, click Checkout.",
      "All users on the account will automatically receive an email containing the Driver Return Inspection Report.",
    ],
  },
];
