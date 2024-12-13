// import mongoose from "mongoose";

// const doctorSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     image: { type: String, required: true },
//     speciality: { type: String, required: true },
//     degree: { type: String, required: true },
//     experience: { type: String, required: true },
//     about: { type: String, required: true },
//     available: { type: Boolean,default:true},
//     fees: { type: Number, required: true },
//     address: { type: Object, required: true },
//     date: { type: Number, required: true },
//     slots_booked: { type: Object, default: {} },
//   },
//   { minimize: false }
// );

// const doctorModel =
//   mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

// export default doctorModel;
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
  },
  { minimize: false }
);

// Add a pre-save hook to modify the name field
doctorSchema.pre("save", function (next) {
  // If the name doesn't already start with 'Dr.', add it
  if (!this.name.startsWith("Dr. ")) {
    this.name = `Dr. ${this.name}`;
  }
  next();
});

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
