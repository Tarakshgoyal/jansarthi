/**
 * Ward configuration for Dehradun Nagar Nigam
 * Contains all 100 wards with their details
 */

export interface Ward {
  id: number;
  name: string;
  nameHindi: string;
  parshadName: string;
  address: string;
  phone: string | null;
}

export const WARDS: Ward[] = [
  { id: 1, name: "Malshi", nameHindi: "मालसी", parshadName: "श्री सुमेन्द्र सिंह बोहरा", address: "गांव बी0पी0ओ0 सिनौला मालसी देहरादून", phone: "7983058123" },
  { id: 2, name: "Vijaypur", nameHindi: "विजयपुर", parshadName: "श्री सागर लामा", address: "जोहड़ी गांव, राजपुर रोड़ (सिनोला), देहरादून", phone: "9756447777" },
  { id: 3, name: "Ranjhawala", nameHindi: "रांझावाला", parshadName: "श्री अनिल क्षेत्री", address: "रांझावाला, रायपुर, देहरादून", phone: "9917515554" },
  { id: 4, name: "Rajpur", nameHindi: "राजपुर", parshadName: "श्रीमती महिमा", address: "चालंग सहस्त्रधारा एन्क्लेव देहरादून", phone: null },
  { id: 5, name: "Dhorankhash", nameHindi: "धोरणखास", parshadName: "श्रीमती अल्पना राणा", address: "35 सुद्धोवाला कन्डोली देहरादून", phone: "9837311580" },
  { id: 6, name: "Doon Vihar", nameHindi: "दून विहार", parshadName: "श्रीमती मिनाक्षी नौटियाल", address: "205 दूनविहार देहरादून", phone: "7017259754" },
  { id: 7, name: "Jakhan", nameHindi: "जाखन", parshadName: "श्री अरविन्द चौधरी", address: "234/1 आर्यनगर देहरादून", phone: "9837641023" },
  { id: 8, name: "Salawala", nameHindi: "सालावाला", parshadName: "श्री भूपेन्द्र सिंह कठैत", address: "151 सालावाला, देहरादून", phone: "9837091955" },
  { id: 9, name: "Arya Nagar", nameHindi: "आर्यनगर", parshadName: "श्री योगेश घाघट", address: "76/131 लेन नं0-6 साकेत देहरादून", phone: "7417428538" },
  { id: 10, name: "Dobhalwala", nameHindi: "डोभालवाला", parshadName: "श्री मोहन बहुगुणा", address: "45/11 डंगवाल मार्ग देहरादून", phone: "9897211200" },
  { id: 11, name: "Vijay Colony", nameHindi: "विजय कालोनी", parshadName: "श्री अनुप कुमार", address: "162 पथरियापीर नैशविला रोड़ देहरादून", phone: "9997621571" },
  { id: 12, name: "Kishan Nagar", nameHindi: "किशन नगर", parshadName: "श्रीमती नन्दनी शर्मा", address: "626/2 सिरमौर मार्ग, लोहारवाला, देहरादून", phone: "9997238708" },
  { id: 13, name: "D.L. Road", nameHindi: "डी0एल0 रोड़", parshadName: "श्रीमती बरखा रानी", address: "187/3 डीएल रोड़ देहरादून", phone: "9027022115" },
  { id: 14, name: "Rispana", nameHindi: "रिस्पना", parshadName: "श्रीमती रानी कौर", address: "285 ओल्ड डालनवाला, देहरादून", phone: "9837095726" },
  { id: 15, name: "Karanpur", nameHindi: "करनपुर", parshadName: "श्री रवि कुमार", address: "288 करनपुर देहरादून", phone: "8445095981" },
  { id: 16, name: "Bakralwala", nameHindi: "बकरालवाला", parshadName: "श्री अशोक डोबरियाल", address: "277 ओंकार रोड़ देहरादून", phone: "9058932303" },
  { id: 17, name: "Chukkhuwala", nameHindi: "चुक्खुवाला", parshadName: "श्री अर्जुन सोनकर", address: "305 चुक्खुवाला, देहरादून", phone: "7533977779" },
  { id: 18, name: "Indira Colony", nameHindi: "इंदिरा कालोनी", parshadName: "कु0 वंशिका सोनकर", address: "51 चक्खुवाला देहरादून", phone: "9997754101" },
  { id: 19, name: "Ghanta Ghar Kalika Mandir", nameHindi: "घण्टाघर कालिका मंदिर", parshadName: "श्री संतोख सिंह नागपाल (सोनू)", address: "28/32 कालिका मन्दिर देहरादून", phone: "9412955285" },
  { id: 20, name: "Race Course North", nameHindi: "रेसकोर्स उत्तर", parshadName: "श्री विरेन्द्र सिंह", address: "65 शिव मन्दिर कालोनी देहरादून", phone: "9837765610" },
  { id: 21, name: "M.K.P.", nameHindi: "एम0के0पी0", parshadName: "श्री रोहन चन्देल", address: "415/1 शिवालिक एनक्लेव, रेसकोर्स, देहरादून", phone: "8126178737" },
  { id: 22, name: "Tilak Road", nameHindi: "तिलक रोड़", parshadName: "श्रीमती अनिता गर्ग", address: "44 खुड़बुड़ा मौहल्ला, देहरादून", phone: "7983283749" },
  { id: 23, name: "Khurbura", nameHindi: "खुड़बुड़ा", parshadName: "श्रीमती विमला गौड़", address: "462 खुड़बुड़ा मौहल्ला, देहरादून", phone: "8279705902" },
  { id: 24, name: "Shivaji Marg", nameHindi: "शिवाजी मार्ग", parshadName: "श्री विशाल कुमार", address: "125 खुड़बुड़ा ब्लाक-4, देहरादून", phone: "8126373765" },
  { id: 25, name: "Indresh Nagar", nameHindi: "इंद्रेश नगर", parshadName: "श्री मनोज कुमार", address: "51/1 इन्द्रेश नगर, देहरादून", phone: "9837731680" },
  { id: 26, name: "Dhamawala", nameHindi: "धामावाला", parshadName: "श्री प्रमोद कुमार गुप्ता", address: "61 डिस्पेन्सरी रोड़, देहरादून", phone: null },
  { id: 27, name: "Jhanda Mohalla", nameHindi: "झण्डा मौहल्ला", parshadName: "श्री वैभव अग्रवाल", address: "55 राजा रोड़ देहरादून", phone: "7017842983" },
  { id: 28, name: "Dalanwala North", nameHindi: "डालनवाला उत्तर", parshadName: "श्रीमती कमला देवी", address: "272 चन्दर रोड़ नयी बस्ती देहरादून", phone: "9058633388" },
  { id: 29, name: "Dalanwala East", nameHindi: "डालनवाला पूरब", parshadName: "श्री निखिल कुमार", address: "7 संजय कालोनी, मोहिनी रोड़, देहरादून", phone: "8979494244" },
  { id: 30, name: "Dalanwala South", nameHindi: "डालनवाला दक्षिण", parshadName: "श्रीमती सुनीता मंजखोला", address: "म0नं0-16 लेन नं0-2ओमविहार देहरादून", phone: "9760676688" },
  { id: 31, name: "Kaulagarh", nameHindi: "कौलागढ़", parshadName: "श्रीमती देवकी नौटियाल", address: "प्रेमपुर माफी देहरादून", phone: "639775138" },
  { id: 32, name: "Ballupur", nameHindi: "बल्लूपुर", parshadName: "श्रीमती कोमल वोहरा", address: "9/2 कौलागढ़ रोड़, देहरादून", phone: "8937046014" },
  { id: 33, name: "Yamuna Colony", nameHindi: "यमुना कालोनी", parshadName: "श्री संजय सिंघल", address: "27 कालिन्दी एन्क्लेव देहरादून", phone: "997841959" },
  { id: 34, name: "Govindgarh", nameHindi: "गोविन्दगढ़", parshadName: "श्रीमती महेन्द्र कौर कुकरेजा", address: "63 गोविन्दगढ़, देहरादून", phone: "9412174290" },
  { id: 35, name: "Suman Nagar", nameHindi: "सुमन नगर", parshadName: "श्रीमती संगीता गुप्ता (मेधा)", address: "9/2 मित्रलोक कालोनी, बल्लूपुर रोड़, देहरादून", phone: "9758867800" },
  { id: 36, name: "Vijay Park", nameHindi: "विजय पार्क", parshadName: "श्रीमती अमिता सिंह", address: "राज मार्केट, कांवली रोड़, देहरादून", phone: "9412052424" },
  { id: 37, name: "Basant Vihar", nameHindi: "बसंत विहार", parshadName: "श्री अंकित अग्रवाल", address: "6 बी, आर्शीवाद एनक्लेव, देहरादून", phone: "9756506915" },
  { id: 38, name: "Panditwari", nameHindi: "पंण्डितवाड़ी", parshadName: "श्री अभिषेक तिवारी (सोनू तिवारी)", address: "177 तिवारी मौहल्ला, देहरादून", phone: "8475854444" },
  { id: 39, name: "Indira Nagar", nameHindi: "इंदिरा नगर", parshadName: "श्री प्रवीन सिंह नेगी", address: "326 इन्द्रानगर कालोनी, देहरादून", phone: "9897771219" },
  { id: 40, name: "Seema Dwar", nameHindi: "सीमाद्वार", parshadName: "श्री विनोद रावत", address: "88 ए0डब्लू0एच0ओ0 जमस्व नगर, देहरादून", phone: "9410122776" },
  { id: 41, name: "Indrapuram", nameHindi: "इंदिरापुरम", parshadName: "श्रीमती बबीता गुप्ता", address: "18 इन्द्रापुरम, देहरादून", phone: "9149210992" },
  { id: 42, name: "Kanwali", nameHindi: "कांवली", parshadName: "श्रीमती रेनू देवी", address: "117 जी0एम0एस0 रोड़ कांवली, देहरादून", phone: "9368243522" },
  { id: 43, name: "Dronpuri", nameHindi: "द्रोणपुरी", parshadName: "श्रीमती रजनी", address: "75 संगम विहार, गांधी ग्राम, देहरादून", phone: "9358361377" },
  { id: 44, name: "Patel Nagar West", nameHindi: "पटेल नगर पश्चिम", parshadName: "सुश्री डोली रानी मोहन", address: "66 पटेलनगर पश्चिम, देहरादून", phone: "7895482987" },
  { id: 45, name: "Gandhi Gram", nameHindi: "गांधी ग्राम", parshadName: "श्रीमती मीनाक्षी मौर्या", address: "131/6 गुरू रोड़, देहरादून", phone: "7500141649" },
  { id: 46, name: "Adhoiwala", nameHindi: "अधोईवाला", parshadName: "श्रीमती मोनिका", address: "शिव गिरधर निकुंज, देहरादून", phone: null },
  { id: 47, name: "Chandar Road MDDA Colony", nameHindi: "चन्दर रोड़, एम0डी0डी0ए0 कालोनी", parshadName: "श्री अजय त्यागी उर्फ रोबिन त्यागी", address: "एम0आई0जी0 3 एम0डी0डी0ए0 कालोनी, देहरादून", phone: "9897636351" },
  { id: 48, name: "Badrish Colony", nameHindi: "बद्रीश कालोनी", parshadName: "श्रीमती कमली भट्ट", address: "280 शिवपुरी कालोनी, मोहिनी रोड़, देहरादून", phone: "9837971181" },
  { id: 49, name: "Bhagat Singh Colony", nameHindi: "भगत सिंह कालोनी", parshadName: "श्री अब्दुल रेहमान", address: "इन्दर रोड़, भगत सिंह कालोनी, देहरादून", phone: "9897976122" },
  { id: 50, name: "Rajiv Nagar", nameHindi: "राजीव नगर", parshadName: "श्री महेन्द्र सिंह रावत", address: "राजीव नगर लोअर, देहरादून", phone: "9897029546" },
  { id: 51, name: "Vani Vihar", nameHindi: "वाणी विहार", parshadName: "श्री त्रिलोक सिंह", address: "15 शान्तिविहार, देहरादून", phone: "9412057824" },
  { id: 52, name: "Ajabpur Saraswati Vihar", nameHindi: "अजबपुर सरस्वती विहार", parshadName: "श्री सोहन सिंह रौतेला", address: "सरस्वती विहार डी0 ब्लॉक, देहरादून", phone: "7895577886" },
  { id: 53, name: "Mata Mandir Road", nameHindi: "माता मंदिर रोड़", parshadName: "श्री विमल चन्द्र उनियाल", address: "97 सुमननगर धर्मपुर, देहरादून", phone: "9759588631" },
  { id: 54, name: "Chandra Singh Garhwali Ajabpur", nameHindi: "चन्द्र सिंह गढ़वाली अजबपुर", parshadName: "श्रीमती रजनी ढौंडियाल", address: "118 पुष्पविहार, देहरादून", phone: "9634473469" },
  { id: 55, name: "Shah Nagar", nameHindi: "शाहनगर", parshadName: "श्री राकेश कुमार", address: "ममाँ गंगा डेयरी गोरखपुर शांहनगर, देहरादून", phone: "9997502880" },
  { id: 56, name: "Dharampur", nameHindi: "धर्मपुर", parshadName: "श्री अमित भण्डारी (दीपू)", address: "ए/172 नेहरू कालोनी, देहरादून", phone: "9997442424" },
  { id: 57, name: "Nehru Colony", nameHindi: "नेहरू कालोनी", parshadName: "श्री विवेक कोठारी", address: "जी0 359 नेहरू कालोनी, देहरादून", phone: "9719743040" },
  { id: 58, name: "Defence Colony", nameHindi: "डिफेन्स कालोनी", parshadName: "श्री देवेन्द्र गैरोला", address: "7 श्रीलोक अजबपुरकंला, देहरादून", phone: "9719150097" },
  { id: 59, name: "Gujrada Mansingh", nameHindi: "गुजराड़ा मानसिंह", parshadName: "श्री संजीत कुमार बंसल", address: "डांडा खुदानेवाला नियर सिद्धार्थ कॉलेज, देहरादून", phone: "9837155031" },
  { id: 60, name: "Danda Lakhond", nameHindi: "डांडा लखौण्ड", parshadName: "श्री अभिषेक पन्त", address: "डांडा लखौण्ड, देहरादून", phone: "9927161817" },
  { id: 61, name: "Aamwala Tarla", nameHindi: "आमवाला तरला", parshadName: "श्री प्रशान्त डोभाल", address: "27 सुमनपुरी अधोईवाला, देहरादून", phone: "9758038638" },
  { id: 62, name: "Nanurkhera", nameHindi: "ननूरखेड़ा", parshadName: "श्री सुमित पुंडीर", address: "4 ननूरखेड़ा नालापानी, देहरादून", phone: "8650464646" },
  { id: 63, name: "Ladpur", nameHindi: "लाडपुर", parshadName: "श्री दिनेश केमवाल", address: "8/18 शिवलोक कालोनी लाडपुर, देहरादून", phone: "9719277551" },
  { id: 64, name: "Nehru Gram", nameHindi: "नेहरूग्राम", parshadName: "श्रीमती सुशीला", address: "लोअर गढ़वाली कांलोनी, देहरादून", phone: "9410186524" },
  { id: 65, name: "Dobhal Chowk", nameHindi: "डोभाल चौक", parshadName: "श्रीमती विजय लक्ष्मी नेगी", address: "13 वनस्थली, देहरादून", phone: "8909161444" },
  { id: 66, name: "Raipur", nameHindi: "रायपुर", parshadName: "श्री कपिल धर", address: "17 अपर रायपुर, देहरादून", phone: "8937939108" },
  { id: 67, name: "Mokhampur", nameHindi: "मोहकमपुर", parshadName: "श्री रविन्द्र सिंह रावत", address: "भगवतीपूरम माजरी माफी मोहकमपुर रावत आर्टस, देहरादून", phone: "9808373739" },
  { id: 68, name: "Chaktunwala", nameHindi: "चकतुनवाला", parshadName: "श्रीमती पूजा नेगी", address: "लेन नं0-6 मियावाला, देहरादून", phone: "9997866309" },
  { id: 69, name: "Ritha Mandi", nameHindi: "रीठामण्डी", parshadName: "श्री इतात खॉ", address: "14/6 मुस्लिम कालोनी, देहरादून", phone: "8791729998" },
  { id: 70, name: "Lakhi Bag", nameHindi: "लक्खीबाग", parshadName: "श्री आयुष गुप्ता", address: "309 रामनुर लक्खीबाग, देहरादून", phone: "7060329292" },
  { id: 71, name: "Patel Nagar East", nameHindi: "पटेल नगर पू0", parshadName: "श्री महीपाल धीमान", address: "79/1 भण्डारी बाग, देहरादून", phone: "9358104121" },
  { id: 72, name: "Dehra Khash", nameHindi: "देहराखास", parshadName: "श्री आलोक कुमार", address: "16/2 पथरी बाग, देहरादून", phone: "9258516001" },
  { id: 73, name: "Vidya Vihar", nameHindi: "विद्या विहार", parshadName: "श्री रमेश चन्द्र गौड़", address: "23 आदर्शविहार कारगी , देहरादून", phone: "9760047625" },
  { id: 74, name: "Brahmpuri", nameHindi: "ब्रहमपुरी", parshadName: "श्री सतीश कश्यप", address: "18 निरंजनपुर, देहरादून", phone: "9897002678" },
  { id: 75, name: "Lohia Nagar", nameHindi: "लोहिया नगर", parshadName: "श्री मुकीम अहमद", address: "1504 ब्राहमणवाला, देहरादून", phone: "9897402467" },
  { id: 76, name: "Niranjanpur", nameHindi: "निरंजनपुर", parshadName: "श्रीमती पूनम पुण्डीर", address: "88/2 कश्मीरी कालोनी, देहरादून", phone: "9760992942" },
  { id: 77, name: "Majra", nameHindi: "माजरा", parshadName: "श्री जाहिद अंसारी", address: "मस्जिदवाली गली, देहरादून", phone: "9837381807" },
  { id: 78, name: "Turner Road", nameHindi: "टर्नर रोड़", parshadName: "श्रीमती कुसुम वर्मा", address: "275 तिलक बाजार रोड़, देहरादून", phone: "9927393413" },
  { id: 79, name: "Bharuwala Grant", nameHindi: "भारूवाला ग्रांट", parshadName: "श्री दीपक कुमार नेगी", address: "दीपनिवास बैलरोड़, देहरादून", phone: "9760344768" },
  { id: 80, name: "Rest Camp", nameHindi: "रैस्ट कैम्प", parshadName: "श्रीमती अंजली सिंघल", address: "352/19 नानक विहार, देहरादून", phone: "9634954947" },
  { id: 81, name: "Race Course South", nameHindi: "रेसकोर्स दक्षिण", parshadName: "श्रीमती राखी बड़थ्वाल", address: "82 रेसकोर्स, ऑफिसर कालोनी, देहरादून", phone: "9719278190" },
  { id: 82, name: "Deep Nagar", nameHindi: "दीपनगर", parshadName: "श्री दिनेश प्रसाद सती", address: "79 दीपनगर अजबपुरकला, देहरादून", phone: "8755176276" },
  { id: 83, name: "Kedarpur", nameHindi: "केदारपुर", parshadName: "श्री दर्शन लाल बिंजोला", address: "शिवकुंज केदारपुर भाग-2, देहरादून", phone: "9568688926" },
  { id: 84, name: "Banjarawala", nameHindi: "बंजारावाला", parshadName: "श्रीमती रूचि", address: "निकट असवाल टेन्ट हाउस, देहरादून", phone: "9760763681" },
  { id: 85, name: "Mothrowala", nameHindi: "मोथरोवाला", parshadName: "श्री सोबत चन्द रमोला", address: "लेन नं0-4 महालक्ष्मीपुरम, देहरादून", phone: "7409301315" },
  { id: 86, name: "Sewala Kalan", nameHindi: "सेवलाकलां", parshadName: "श्रीमती मंजू", address: "सेवलाकला नियर हिमालयन ऐकडमी चन्द्रबनी रोड़, देहरादून", phone: "9897349686" },
  { id: 87, name: "Pithuwala", nameHindi: "पित्थूवाला", parshadName: "श्री पुष्कर चौहान", address: "पित्थुवाला कला पी0ओ0 मेहुवाला, देहरादून", phone: "9997999712" },
  { id: 88, name: "Mehuwala", nameHindi: "मेंहूवाला", parshadName: "श्रीमती तरन्नुम", address: "ममेहुवाला माफी, देहरादून", phone: "8218480122" },
  { id: 89, name: "Harbhajwala", nameHindi: "हरभझवाला", parshadName: "श्रीमती प्रिया वर्मा", address: "हरभझवाला टी0 स्टेट नियर शिवमन्दिर बसन्त विहार रोड़, देहरादून", phone: "9045387557" },
  { id: 90, name: "Mohabbewala", nameHindi: "मौहब्बेवाला", parshadName: "श्री सुधीर थापा", address: "मोहब्बेवाला, देहरादून", phone: "9997677308" },
  { id: 91, name: "Chanderbani", nameHindi: "चन्द्रबनी", parshadName: "श्रीमती सुमन बुटोला", address: "कैलाशपुर स्टेडियम, देहरादून", phone: "7500866140" },
  { id: 92, name: "Arcadia 1", nameHindi: "आरकेडिया प्रथम", parshadName: "श्री अनिल प्रसाद", address: "मोहनपुर नियर पॉवर हाउस, देहरादून", phone: "8755959397" },
  { id: 93, name: "Arcadia 2", nameHindi: "आरकेडिया द्वितीय", parshadName: "श्रीमती किरण", address: "मिट्ठी बाड़ी प्रेमनगर, देहरादून", phone: "7906112633" },
  { id: 94, name: "Nathanpur 1", nameHindi: "नत्थनपुर प्रथम", parshadName: "श्री मेहरबान सिंह भण्डारी", address: "15 सी इन्द्रप्रस्थ, देहरादून", phone: "8077359478" },
  { id: 95, name: "Nathanpur 2", nameHindi: "नत्थनपुर द्वितीय", parshadName: "श्री रविन्द्र (रवि गोसाई)", address: "श्रीलोक शिवालिंक न्यू लेन 4, देहरादून", phone: "6396846246" },
  { id: 96, name: "Nawada", nameHindi: "नवादा", parshadName: "श्री वीरेन्द्र वालिया", address: "बदरीपुर, देहरादून", phone: "3698805010" },
  { id: 97, name: "Harrawala", nameHindi: "हर्रावाला", parshadName: "श्री देवी दयाल", address: "कुआंवाला पम्पींग रेस्टोरेन्ट, देहरादून", phone: "9012801107" },
  { id: 98, name: "Ballawala", nameHindi: "बालावाला", parshadName: "श्री प्रशान्त खरोला", address: "बालावाला मामचन्द चौक, देहरादून", phone: "8449333331" },
  { id: 99, name: "Nakraunda", nameHindi: "नकरौंदा", parshadName: "श्री राहुल", address: "63 नजदीक आईडिया पॉवर नकरौन्दा रोड़, देहरादून", phone: "7500107070" },
  { id: 100, name: "Nathuawala", nameHindi: "नथुआवाला", parshadName: "श्रीमती स्वाति डोभाल", address: "पो0ओ0 नथुवावाला, देहरादून", phone: "9759006149" },
];

/**
 * Get ward map URL for a specific ward
 * @param wardId Ward number (1-100)
 * @returns URL to the ward map image
 */
export const getWardMapUrl = (wardId: number): string => {
  return `https://nagarnigamdehradun.com/images_280819/maps/map2_new/ward${wardId}.jpg`;
};

/**
 * Find ward by ID
 */
export const getWardById = (id: number): Ward | undefined => {
  return WARDS.find(ward => ward.id === id);
};

/**
 * Search wards by name (English or Hindi)
 */
export const searchWards = (query: string): Ward[] => {
  const lowerQuery = query.toLowerCase();
  return WARDS.filter(
    ward =>
      ward.name.toLowerCase().includes(lowerQuery) ||
      ward.nameHindi.includes(query)
  );
};
