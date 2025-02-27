// update styling of buttons remove overlapping//
import { Audio } from "expo-av";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  CameraCapturedPicture,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
// import { VolumeManager } from 'react-native-volume-manager';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [torchMode, setTorchMode] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [src, setSrc] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const langList = [
    "Marathi",
    "Hindi",
    "Telugu",
    "Tamil",
    "Kannada",
    "Bengali",
    "Gujarati",
    "Rajasthani",
    "Malayalam",
  ];
  const [selectedLang, setSelectedLang] = useState<string>("Marathi");
  // const volumeListener = VolumeManager.addVolumeListener((result) => {
  //   console.log('Volume button pressed:', result.volume);
  //   handleTakePhoto();
  // });

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function toggleFlash() {
    setTorchMode((current) => (current === false ? true : false));
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
      };
      const takedPhoto = await cameraRef.current.takePictureAsync(options);
      if (takedPhoto) {
        const source = takedPhoto.base64;
        if (source) {
          setIsPreview(true);
          setIsProcessing(true);
          setSrc(source);
          await handleImageUpload(source);
          setIsProcessing(false);
        }
      }
    }
  };

  interface ImageUploadData {
    file: string;
    lang: string;
  }

  interface ApiResponse {
    description: string;
    translated_text: string;
    audio_data: string;
  }

  const handleImageUpload = async (source: string): Promise<void> => {
    let base64Img = `data:image/jpg;base64,${source}`;
    const data: ImageUploadData = {
      file: base64Img,
      lang: selectedLang,
    };

    try {
      const response = await fetch(
        "https://aa69-2409-40c2-305f-69e8-fe1e-9607-ad85-6c58.ngrok-free.app/generate-description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const data: ApiResponse = await response.json();

        // Set description and translated text from the response
        setDescription(data.description);
        setTranslatedText(data.translated_text);

        // Process base64 audio data for playback
        const audioUri = `data:audio/wav;base64,${data.audio_data}`;
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setAudio(sound);
      } else {
        console.error("Error generating audio description");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleRetakePhoto = () => {
    setDescription(null);
    setTranslatedText(null);
    setIsPreview(false);
    if (audio) {
      audio.unloadAsync();
      setAudio(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.container_lang}>
        <RNPickerSelect
          onValueChange={(value) => setSelectedLang(value)}
          items={[
            { label: "Marathi", value: "Marathi" },
            { label: "Hindi", value: "Hindi" },
            { label: "Telugu", value: "Telugu" },
            { label: "Tamil", value: "Tamil" },
            { label: "Kannada", value: "Kannada" },
            { label: "Bengali", value: "Bengali" },
            { label: "Gujarati", value: "Gujarati" },
            { label: "Rajasthani", value: "Rajasthani" },
            { label: "Malayalam", value: "Malayalam" },
          ]}
          style={pickerSelectStyles}
          value={selectedLang}
        />
      </View>

      {isPreview ? (
        <View style={styles.previewContainer}>
          {src && (
            <Image
              source={{ uri: `data:image/jpg;base64,${src}` }}
              style={styles.preview}
            />
          )}
          {isProcessing && (
            <View>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>Processing.....</Text>
            </View>
          )}
          {description && <Text>{description}</Text>}
          {translatedText && <Text>{translatedText}</Text>}
          <TouchableOpacity style={styles.actionButton} onPress={() => audio?.replayAsync()}>
            <Text style={styles.buttonText}>Repeat Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleRetakePhoto}>
            <Text style={styles.buttonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          enableTorch={torchMode}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraFacing}
            >
              <AntDesign name="retweet" size={40} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTakePhoto}
              style={styles.buttonmain}
            />
            <TouchableOpacity style={styles.button} onPress={toggleFlash}>
              <MaterialIcons
                name={torchMode === false ? "flash-off" : "flash-on"}
                size={40}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const WINDOW_HEIGHT = Dimensions.get("window").height;
const CAPTURE_SIZE = Math.floor(WINDOW_HEIGHT * 0.08);
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  previewContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  preview: { width: 300, height: 300, marginBottom: 20 },
  camera: { flex: 1 },
  buttonContainer: {
    position: "absolute",
    flexDirection: "row",
    bottom: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#5A45FF",
    height: CAPTURE_SIZE,
    width: CAPTURE_SIZE,
    borderRadius: Math.floor(CAPTURE_SIZE / 2),
    marginBottom: 50,
    marginHorizontal: 30,
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonmain: {
    backgroundColor: "#5A45FF",
    height: CAPTURE_SIZE + 10,
    width: CAPTURE_SIZE + 10,
    borderRadius: Math.floor(CAPTURE_SIZE / 2),
    marginBottom: 28,
    marginHorizontal: 30,
    borderWidth: 5,
    borderColor: "white",
  },
  permissionButton: {
    backgroundColor: "#5A45FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center", 
    width: "50%",
    marginTop: 20,
  },
  
  actionButton: {
    backgroundColor: "#5A45FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  text: { fontSize: 18, fontWeight: "bold", color: "white", padding: 10 },
  container_lang: {
    backgroundColor: "#F5FCFF",
    marginTop: 20,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});



//Upload from Gallery Section//
// import { Audio } from "expo-av";
// import { AntDesign, MaterialIcons } from "@expo/vector-icons";
// import {
//   CameraType,
//   CameraView,
//   useCameraPermissions,
// } from "expo-camera";
// import { useRef, useState } from "react";
// import {
//   Button,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Dimensions,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";
// import * as ImagePicker from 'expo-image-picker';

// // Define types for the image upload data and the response from the API
// interface ImageUploadData {
//   file: string;
//   lang: string;
// }

// interface ApiResponse {
//   description: string;
//   translated_text: string;
//   audio_data: string;
// }

// export default function Camera() {
//   const [facing, setFacing] = useState<CameraType>("back");
//   const [torchMode, setTorchMode] = useState<boolean>(false);
//   const [permission, requestPermission] = useCameraPermissions();
//   const [src, setSrc] = useState<string | null>(null);
//   const [description, setDescription] = useState<string | null>(null);
//   const [translatedText, setTranslatedText] = useState<string | null>(null);
//   const [audio, setAudio] = useState<Audio.Sound | null>(null);
//   const cameraRef = useRef<CameraView | null>(null);
//   const [isPreview, setIsPreview] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const langList = [
//     "Marathi",
//     "Hindi",
//     "Telugu",
//     "Tamil",
//     "Kannada",
//     "Bengali",
//     "Gujarati",
//     "Rajasthani",
//     "Malayalam",
//   ];
//   const [selectedLang, setSelectedLang] = useState<string>("Marathi");

//   // Request gallery permissions on app load
//   const requestGalleryPermission = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       alert('Permission to access the gallery is required!');
//     }
//   };

//   // Call this when the user selects an image from the gallery
//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         quality: 1,
//       });

//       if (!result.canceled && result.assets[0]?.uri) {
//         const source = result.assets[0].uri;
//         setIsPreview(true);
//         setIsProcessing(true);
//         setSrc(source); // Set the selected image as the source
//         await handleImageUpload(source);
//         setIsProcessing(false);
//       }
//     } catch (error) {
//       console.error("Error picking image: ", error);
//     }
//   };

//   // Function to toggle the camera facing direction
//   function toggleCameraFacing() {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   }

//   // Function to toggle the flashlight
//   function toggleFlash() {
//     setTorchMode((current) => !current);
//   }

//   // Function to handle photo capture
//   const handleTakePhoto = async () => {
//     if (cameraRef.current) {
//       const options = {
//         quality: 1,
//         base64: true,
//       };
//       const takedPhoto = await cameraRef.current.takePictureAsync(options);
//       if (takedPhoto) {
//         const source = takedPhoto.base64;
//         if (source) {
//           setIsPreview(true);
//           setIsProcessing(true);
//           setSrc(source);
//           await handleImageUpload(source);
//           setIsProcessing(false);
//         }
//       }
//     }
//   };

//   // Function to handle image upload
//   const handleImageUpload = async (source: string): Promise<void> => {
//     let base64Img = `data:image/jpg;base64,${source}`;
//     const data: ImageUploadData = {
//       file: base64Img,
//       lang: selectedLang,
//     };

//     try {
//       const response = await fetch(
//         "https://your-api-url-here.com/generate-description", // Replace with your API URL
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(data),
//         }
//       );

//       if (response.ok) {
//         const data: ApiResponse = await response.json();

//         // Set description and translated text from the response
//         setDescription(data.description);
//         setTranslatedText(data.translated_text);

//         // Process base64 audio data for playback
//         const audioUri = `data:audio/wav;base64,${data.audio_data}`;
//         const { sound } = await Audio.Sound.createAsync(
//           { uri: audioUri },
//           { shouldPlay: true }
//         );
//         setAudio(sound);
//       } else {
//         console.error("Error generating audio description");
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleRetakePhoto = () => {
//     setDescription(null);
//     setTranslatedText(null);
//     setIsPreview(false);
//     if (audio) {
//       audio.unloadAsync();
//       setAudio(null);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.container_lang}>
//         <RNPickerSelect
//           onValueChange={(value) => setSelectedLang(value)}
//           items={langList.map((lang) => ({
//             label: lang,
//             value: lang,
//           }))}
//           style={pickerSelectStyles}
//           value={selectedLang}
//         />
//       </View>

//       {isPreview ? (
//         <View style={styles.previewContainer}>
//           {src && (
//             <Image
//               source={{ uri: src }}
//               style={styles.preview}
//             />
//           )}
//           {isProcessing && (
//             <View>
//               <ActivityIndicator size="large" color="#0000ff" />
//               <Text>Processing.....</Text>
//             </View>
//           )}
//           {description && <Text>{description}</Text>}
//           {translatedText && <Text>{translatedText}</Text>}
//           <Button title="Repeat Audio" onPress={() => audio?.replayAsync()} />
//           <Button title="Retake Photo" onPress={handleRetakePhoto} />
//         </View>
//       ) : (
//         <CameraView
//           style={styles.camera}
//           facing={facing}
//           ref={cameraRef}
//           enableTorch={torchMode}
//         >
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={styles.button}
//               onPress={toggleCameraFacing}
//             >
//               <AntDesign name="retweet" size={40} color="white" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               activeOpacity={0.7}
//               onPress={handleTakePhoto}
//               style={styles.buttonmain}
//             />
//             <TouchableOpacity style={styles.button} onPress={toggleFlash}>
//               <MaterialIcons
//                 name={torchMode === false ? "flash-off" : "flash-on"}
//                 size={40}
//                 color="white"
//               />
//             </TouchableOpacity>
//           </View>
//         </CameraView>
//       )}

//       {/* Add new button to open the gallery */}
//       <TouchableOpacity style={styles.permissionButton} onPress={pickImage}>
//         <Text style={styles.buttonText}>Pick Image from Gallery</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const WINDOW_HEIGHT = Dimensions.get("window").height;
// const CAPTURE_SIZE = Math.floor(WINDOW_HEIGHT * 0.08);
// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center" },
//   previewContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
//   preview: { width: 300, height: 300, marginBottom: 20 },
//   camera: { flex: 1 },
//   buttonContainer: {
//     position: "absolute",
//     flexDirection: "row",
//     bottom: 28,
//     width: "100%",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   button: {
//     backgroundColor: "#5A45FF",
//     height: CAPTURE_SIZE,
//     width: CAPTURE_SIZE,
//     borderRadius: Math.floor(CAPTURE_SIZE / 2),
//     marginBottom: 50,
//     marginHorizontal: 30,
//     borderWidth: 2,
//     borderColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   buttonmain: {
//     backgroundColor: "#5A45FF",
//     height: CAPTURE_SIZE + 10,
//     width: CAPTURE_SIZE + 10,
//     borderRadius: Math.floor(CAPTURE_SIZE / 2),
//     marginBottom: 28,
//     marginHorizontal: 30,
//     borderWidth: 5,
//     borderColor: "white",
//   },
//   buttonText: { color: "white" },
//   container_lang: {
//     backgroundColor: "#F5FCFF",
//     marginTop: 20,
//   },
//   permissionButton: {
//     backgroundColor: "#5A45FF",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     marginTop: 10,
//     borderRadius: 5,
//     alignItems: "center",
//   },
// });

// const pickerSelectStyles = StyleSheet.create({
//   inputIOS: {
//     fontSize: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: "gray",
//     borderRadius: 4,
//     color: "black",
//     paddingRight: 30,
//   },
//   inputAndroid: {
//     fontSize: 16,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderWidth: 0.5,
//     borderColor: "purple",
//     borderRadius: 8,
//     color: "black",
//     paddingRight: 30,
//   },
// });




// import { Audio } from "expo-av";
// import { AntDesign, MaterialIcons } from "@expo/vector-icons";
// import {
//   CameraType,
//   CameraView,
//   useCameraPermissions,
//   CameraCapturedPicture,
// } from "expo-camera";
// import { useRef, useState } from "react";
// import {
//   Button,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Dimensions,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";

// export default function Camera() {
//   const [facing, setFacing] = useState<CameraType>("back");
//   const [torchMode, setTorchMode] = useState<boolean>(false);
//   const [permission, requestPermission] = useCameraPermissions();
//   const [src, setSrc] = useState<string | null>(null);
//   const [description, setDescription] = useState<string | null>(null);
//   const [translatedText, setTranslatedText] = useState<string | null>(null);
//   const [audio, setAudio] = useState<Audio.Sound | null>(null);
//   const cameraRef = useRef<CameraView | null>(null);
//   const [isPreview, setIsPreview] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const langList = [
//     "Marathi",
//     "Hindi",
//     "Telugu",
//     "Tamil",
//     "Kannada",
//     "Bengali",
//     "Gujarati",
//     "Rajasthani",
//     "Malayalam",
//   ];
//   const [selectedLang, setSelectedLang] = useState<string>("Marathi");

//   if (!permission) {
//     return <View />;
//   }

//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={{ textAlign: "center" }}>
//           We need your permission to show the camera
//         </Text>
//         <Button onPress={requestPermission} title="grant permission" />
//       </View>
//     );
//   }

//   function toggleCameraFacing() {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   }

//   function toggleFlash() {
//     setTorchMode((current) => (current === false ? true : false));
//   }

//   const handleTakePhoto = async () => {
//     if (cameraRef.current) {
//       const options = {
//         quality: 1,
//         base64: true,
//       };
//       const takedPhoto = await cameraRef.current.takePictureAsync(options);
//       if (takedPhoto) {
//         const source = takedPhoto.base64;
//         if (source) {
//           setIsPreview(true);
//           setIsProcessing(true);
//           setSrc(source);
//           await handleImageUpload(source);
//           setIsProcessing(false);
//         }
//       }
//     }
//   };

//   interface ImageUploadData {
//     file: string;
//     lang: string;
//   }

//   interface ApiResponse {
//     description: string;
//     translated_text: string;
//     audio_data: string;
//   }

//   const handleImageUpload = async (source: string): Promise<void> => {
//     let base64Img = `data:image/jpg;base64,${source}`;
//     const data: ImageUploadData = {
//       file: base64Img,
//       lang: selectedLang,
//     };

//     try {
//       const response = await fetch(
//         "https://c8c3-2409-40c2-1196-8981-128-e705-b880-acb5.ngrok-free.app/generate-description",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(data),
//         }
//       );

//       if (response.ok) {
//         const data: ApiResponse = await response.json();

//         // Set description and translated text from the response
//         setDescription(data.description);
//         setTranslatedText(data.translated_text);

//         // Process base64 audio data for playback
//         const audioUri = `data:audio/wav;base64,${data.audio_data}`;
//         const { sound } = await Audio.Sound.createAsync(
//           { uri: audioUri },
//           { shouldPlay: true }
//         );
//         setAudio(sound);
//       } else {
//         console.error("Error generating audio description");
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleRetakePhoto = () => {
//     setDescription(null);
//     setTranslatedText(null);
//     setIsPreview(false);
//     if (audio) {
//       audio.unloadAsync();
//       setAudio(null);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style = {styles.container_lang}>
//         <RNPickerSelect
//           onValueChange={(value) => setSelectedLang(value)}
//           items={[
//             { label: "Marathi", value: "Marathi" },
//             { label: "Hindi", value: "Hindi" },
//             { label: "Telugu", value: "Telugu" },
//             { label: "Tamil", value: "Tamil" },
//             { label: "Kannada", value: "Kannada" },
//             { label: "Bengali", value: "Bengali" },
//             { label: "Gujarati", value: "Gujarati" },
//             { label: "Rajasthani", value: "Rajasthani" },
//             { label: "Malayalam", value: "Malayalam" },
//           ]}
//           style={pickerSelectStyles}
//           value={selectedLang}
//         />
//       </View>

//       {isPreview ? (
//         <View style={styles.previewContainer}>
//           {src && (
//             <Image
//               source={{ uri: `data:image/jpg;base64,${src}` }}
//               style={styles.preview}
//             />
//           )}
//           {isProcessing && (
//             <View>
//               <ActivityIndicator size="large" color="#0000ff" />
//               <Text>Processing.....</Text>
//             </View>
//           )}
//           {description && <Text>{description}</Text>}
//           {translatedText && <Text>{translatedText}</Text>}
//           <Button title="Repeat Audio" onPress={() => audio?.replayAsync()} />
//           <Button title="Retake Photo" onPress={handleRetakePhoto} />
//         </View>
//       ) : (
//         <CameraView
//           style={styles.camera}
//           facing={facing}
//           ref={cameraRef}
//           enableTorch={torchMode}
//         >
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={styles.button}
//               onPress={toggleCameraFacing}
//             >
//               <AntDesign name="retweet" size={40} color="white" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               activeOpacity={0.7}
//               onPress={handleTakePhoto}
//               style={styles.buttonmain}
//             />
//             <TouchableOpacity style={styles.button} onPress={toggleFlash}>
//               <MaterialIcons
//                 name={torchMode === false ? "flash-off" : "flash-on"}
//                 size={40}
//                 color="white"
//               />
//             </TouchableOpacity>
//           </View>
//         </CameraView>
//       )}
//     </View>
//   );
// }
// const WINDOW_HEIGHT = Dimensions.get("window").height;
// const CAPTURE_SIZE = Math.floor(WINDOW_HEIGHT * 0.08);
// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center" },
//   previewContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
//   preview: { width: 300, height: 300, marginBottom: 20 },
//   camera: { flex: 1 },
//   buttonContainer: {
//     position: "absolute",
//     flexDirection: "row",
//     bottom: 28,
//     width: "100%",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   button: {
//     backgroundColor: "#5A45FF",
//     height: CAPTURE_SIZE,
//     width: CAPTURE_SIZE,
//     borderRadius: Math.floor(CAPTURE_SIZE / 2),
//     marginBottom: 50,
//     marginHorizontal: 30,
//     borderWidth: 2,
//     borderColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   buttonmain: {
//     backgroundColor: "#5A45FF",
//     height: CAPTURE_SIZE + 10,
//     width: CAPTURE_SIZE + 10,
//     borderRadius: Math.floor(CAPTURE_SIZE / 2),
//     marginBottom: 28,
//     marginHorizontal: 30,
//     borderWidth: 5,
//     borderColor: "white",
//   },
//   buttonText: { color: "white" },
//   text: { fontSize: 18, fontWeight: "bold", color: "white", padding: 10 },
//   container_lang: {
//     backgroundColor: "#F5FCFF",
//     marginTop: 20,
//   },
// });

// const pickerSelectStyles = StyleSheet.create({
//   inputIOS: {
//     fontSize: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: "gray",
//     borderRadius: 4,
//     color: "black",
//     paddingRight: 30, 
//   },
//   inputAndroid: {
//     fontSize: 16,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderWidth: 0.5,
//     borderColor: "purple",
//     borderRadius: 8,
//     color: "black",
//     paddingRight: 30,
//   },
// });




// import { Audio } from "expo-av";
// import { AntDesign, MaterialIcons } from "@expo/vector-icons";
// import {
//   CameraCapturedPicture,
//   CameraType,
//   CameraView,
//   useCameraPermissions,
// } from "expo-camera";
// import { useRef, useState } from "react";
// import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import * as FileSystem from "expo-file-system";


// export default function Camera() {
//   const [facing, setFacing] = useState<CameraType>("back");
//   const [flashMode, setFlashMode] = useState<boolean>(false);
//   const [permission, requestPermission] = useCameraPermissions();
//   // const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
//   const [description, setDescription] = useState<string | null>(null);
//   const [translatedText, setTranslatedText] = useState<string | null>(null);
//   const [audio, setAudio] = useState<Audio.Sound | null>(null);
//   const cameraRef = useRef<CameraView | null>(null);

//   if (!permission) {
//     return <View />;
//   }

//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={{ textAlign: "center" }}>
//           We need your permission to show the camera
//         </Text>
//         <Button onPress={requestPermission} title="grant permission" />
//       </View>
//     );
//   }

//   function toggleCameraFacing() {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   }

//   function toggleFlash() {
//     setFlashMode((current) => (current === false ? true : false));
//   }

//   const handleTakePhoto = async () => {
//     if (cameraRef.current) {
//       const options = {
//         quality: 1,
//         base64: true,
//       };
//       const takedPhoto = await cameraRef.current.takePictureAsync(options);
//       if (takedPhoto) {
//         const source = takedPhoto.base64;
//         if (source) {
//           await handleImageUpload(source);
//         }
//       }
//     }
//   };

//   interface ImageUploadData {
//     file: string;
//     lang: string;
//   }

//   interface ApiResponse {
//     description: string;
//     translated_text: string;
//     audio_data: string;
//   }

//   const handleImageUpload = async (source: string): Promise<void> => {
//     let base64Img = `data:image/jpg;base64,${source}`;
//     const data: ImageUploadData = {
//       file: base64Img,
//       lang: "Marathi",
//     };

//     try {
//       const response = await fetch(
//         "https://2028-2409-40c2-4019-3b33-3ad9-7ec7-2439-5f4b.ngrok-free.app/generate-description",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(data),
//         }
//       );

//       if (response.ok) {
//         const data: ApiResponse = await response.json();

//         // Set description and translated text from the response
//         setDescription(data.description);
//         setTranslatedText(data.translated_text);

//         // Process base64 audio data for playback
//         const audioUri = `data:audio/wav;base64,${data.audio_data}`;
//         const { sound } = await Audio.Sound.createAsync(
//           { uri: audioUri },
//           { shouldPlay: true }
//         );
//         setAudio(sound);
//       } else {
//         console.error("Error generating audio description");
//       }
//     } catch (error) {
//       console.error("Error uploading image:", error);
//     }
//   };

//   const handleRetakePhoto = () => {
//     setDescription(null);
//     setTranslatedText(null);
//     if (audio) {
//       audio.unloadAsync();
//       setAudio(null);
//     }
//   };

//   if (description && translatedText) {
//     return (
//       <View style={styles.previewContainer}>
//         <Text style={styles.text}>Description: {description}</Text>
//         <Text style={styles.text}>Translated Text: {translatedText}</Text>
//         <TouchableOpacity style={styles.button} onPress={handleRetakePhoto}>
//           <AntDesign name="camerao" size={24} color="black" />
//           <Text style={styles.buttonText}>Retake</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.button}
//           onPress={() => audio && audio.playAsync()}
//         >
//           <Text style={styles.buttonText}>Play Audio</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
//             <AntDesign name="retweet" size={44} color="black" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={toggleFlash}>
//             <MaterialIcons
//               name={flashMode === false ? "flash-off" : "flash-on"}
//               size={44}
//               color="black"
//             />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
//             <AntDesign name="camera" size={44} color="black" />
//           </TouchableOpacity>
//         </View>
//       </CameraView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center" },
//   previewContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
//   camera: { flex: 1 },
//   buttonContainer: {
//     position: "absolute",
//     bottom: 30,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     backgroundColor: "transparent",
//   },
//   button: { backgroundColor: "gray", borderRadius: 10, padding: 10 },
//   buttonText: { color: "white" },
//   text: { fontSize: 18, fontWeight: "bold", color: "white", padding: 10 },
// });