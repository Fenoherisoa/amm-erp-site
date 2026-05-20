import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, Animated, Alert, Dimensions, Modal, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { madagascarData } from './madagascarData'; // Manafatra ny raki-daza vaovao

const { width } = Dimensions.get('window');

// --- CONFIGURATION FIREBASE ---
const BASE_URL = "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/";

const PROJECT_PREFIX = {
  "VAROTRA": "V",
  "FAMBOLENA": "F",
  "ASA TANANA": "AT",
  "FIOMPIANA KISOA": "FK",
  "FIOMPIANA AKOHO": "FA",
  "FIOMPIANA GANA": "FG1",
  "FIOMPIANA GISA": "FG2",
  "FIOMPIANA HAFA": "FH"
};

export default function App() {
  // Navigation: "splash" | "login" | "register" | "main" | "admin_panel"
  const [currentScreen, setCurrentScreen] = useState("splash");
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- SPLASH ANIMATION VALS ---
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadeText = useRef(new Animated.Value(0)).current;
  const fadeAssoc = useRef(new Animated.Value(0)).current;

  // --- LOGIN STATES ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- REGISTER STATES ---
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regToken, setRegToken] = useState("");

  // --- MAIN SCREEN STATES (ENQUETE & FIKAROHANA) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [peopleList, setPeopleList] = useState([]);
  const [modalAddPerson, setModalAddPerson] = useState(false);
  const [modalEditPerson, setModalEditPerson] = useState(false);
  
  // States vaovao ho an'ny Dropdown iombonana (Matihanina)
  const [currentDropdownType, setCurrentDropdownType] = useState(""); // "province" | "region" | "district" | "commune" | "tetikasa"
  const [modalSelectGeneric, setModalSelectGeneric] = useState(false);
  const [genericDropdownList, setGenericDropdownList] = useState([]);

  // Formulaire Enquête Vaovao & Fanovana
  const [newAnarana, setNewAnarana] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newCommune, setNewCommune] = useState("");
  const [newFokontany, setNewFokontany] = useState("");
  const [newCin, setNewCin] = useState("");
  const [newDateDelivrance, setNewDateDelivrance] = useState("");
  const [newLieuDelivrance, setNewLieuDelivrance] = useState("");
  const [newIsDuplicata, setNewIsDuplicata] = useState(false);
  const [newDateDuplicata, setNewDateDuplicata] = useState("");
  const [newLieuDuplicata, setNewLieuDuplicata] = useState("");
  const [newTelephone, setNewTelephone] = useState("");
  const [newTetikasa, setNewTetikasa] = useState("");
  
  const [selectedPersonId, setSelectedPersonId] = useState("");

  // --- ADMIN PANEL STATES ---
  const [usersList, setUsersList] = useState([]);
  const [modalAddUser, setModalAddUser] = useState(false);
  const [modalSelectRole, setModalSelectRole] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("");

  // ==========================================
  // SIVANA DATY AUTOMATIQUE (JJ/MM/AAAA)
  // ==========================================
  const format_JJ_MM_AAAA = (text) => {
    let cleaned = text.replace(/\D/g, ''); // Fafana ny tsoratra rehetra tsy tarehimarika
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
    }
    return formatted;
  };

  // ==========================================
  // 1. SPLASH SCREEN ANIMATION
  // ==========================================
  useEffect(() => {
    if (currentScreen === "splash") {
      Animated.sequence([
        Animated.timing(fadeLogo, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(fadeText, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(fadeAssoc, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ]).start();

      const timer = setTimeout(() => {
        setCurrentScreen("login");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // ==========================================
  // 2. VERIFY LOGIN
  // ==========================================
  const handleVerifyLogin = async () => {
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      Alert.alert("Hafatra", "Fenoy ny username sy password!");
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        const response = await fetch(`${BASE_URL}/users/${u}.json`);
        const data = await response.json();

        if (data && data.password.toString() === p) {
          const role = (data.role || "").toUpperCase();
          setUserRole(role);
          setCurrentScreen("main");
        } else {
          Alert.alert("Hadisoana", "Username na Password diso!");
        }
      } catch (error) {
        Alert.alert("Olana", "Tsy misy internet na server error!");
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  // ==========================================
  // 3. REGISTER LOGIC
  // ==========================================
  const handleRegister = async () => {
    const u = regUsername.toLowerCase().trim();
    const p = regPassword.trim();
    const tok = regToken.trim();

    if (!u || !p || !tok) {
      Alert.alert("Hafatra", "Fenoy ny banga rehetra!");
      return;
    }

    setIsLoading(true);
    try {
      const poolRes = await fetch(`${BASE_URL}/token_pool.json`);
      const poolData = await poolRes.json();

      if (!poolData) {
        Alert.alert("Hadisoana", "Tsy misy token azo ampiasaina ankehitriny.");
        setIsLoading(false);
        return;
      }

      let tokenFound = false;
      let userRoleFound = "";
      let matchedCategory = "";

      for (let category in poolData) {
        if (poolData[category].token_miasa === tok) {
          tokenFound = true;
          userRoleFound = poolData[category].role;
          matchedCategory = category;
          break;
        }
      }

      if (tokenFound) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let newCode = "";
        for (let i = 0; i < 6; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        await fetch(`${BASE_URL}/token_pool/${matchedCategory}.json`, {
          method: 'PATCH',
          body: JSON.stringify({ token_miasa: newCode })
        });

        await fetch(`${BASE_URL}/users/${u}.json`, {
          method: 'PUT',
          body: JSON.stringify({ password: p, role: userRoleFound })
        });

        Alert.alert("Fandresena", `Voasoratra ny kaonty! Role: ${userRoleFound}`);
        setRegUsername(""); setRegPassword(""); setRegToken("");
        setCurrentScreen("login");
      } else {
        Alert.alert("Hadisoana", "Token diso na efa lany daty!");
      }
    } catch (error) {
      Alert.alert("Olana", "Nisy kilema ny fifandraisana.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 4. FIKAROHANA ANARANA (Search Logic)
  // ==========================================
  const handleSearchName = async () => {
    const query = searchQuery.toUpperCase().trim();
    const cleanRole = userRole.replace("RESP. ", "").trim();
    
    const tetikasaFantatra = [
      "VAROTRA", "FAMBOLENA", "ASA TANANA", 
      "FIOMPIANA KISOA", "FIOMPIANA AKOHO", 
      "FIOMPIANA GANA", "FIOMPIANA GISA"
    ];

    try {
      const response = await fetch(`${BASE_URL}/olona.json`);
      const allData = await response.json();
      if (!allData) {
        setPeopleList([]);
        return;
      }

      const tempResults = [];
      Object.keys(allData).forEach(key => {
        const p = allData[key];
        if (p && p.anarana && p.anarana.toUpperCase().includes(query)) {
          const pTetikasa = (p.tetikasa || "").toUpperCase().trim();

          if (userRole === "ADMIN" || userRole === "ADHERENT") {
            tempResults.push({ id: key, ...p });
          } else if (cleanRole === "FIOMPIANA HAFA") {
            if (key.startsWith("FH-") || !tetikasaFantatra.includes(pTetikasa)) {
              tempResults.push({ id: key, ...p });
            }
          } else if (cleanRole === pTetikasa) {
            tempResults.push({ id: key, ...p });
          }
        }
      });
      setPeopleList(tempResults);
    } catch (error) {
      console.log(error);
    }
  };

  // ==========================================
  // 5. MANDRAKITRA ENQUETE FENO (Save Logic)
  // ==========================================
  const handleSaveNewPerson = async () => {
    const anarana = newAnarana.toUpperCase().trim();
    const tetikasa = newTetikasa.toUpperCase().trim();

    const lisitraMazava = [
      "VAROTRA", "FAMBOLENA", "ASA TANANA", 
      "FIOMPIANA KISOA", "FIOMPIANA AKOHO", 
      "FIOMPIANA GANA", "FIOMPIANA GISA"
    ];

    if (!anarana || !tetikasa || !newCin) {
      Alert.alert("Hafatra", "Tsy maintsy fenoina ny Anarana, Tetikasa ary CIN!");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/olona.json`);
      const allData = await response.json() || {};
      
      let prefix = "P";
      let count = 0;

      if (lisitraMazava.includes(tetikasa)) {
        prefix = PROJECT_PREFIX[tetikasa] || "P";
        count = Object.values(allData).filter(item => (item.tetikasa || "").toUpperCase() === tetikasa).length;
      } else {
        prefix = "FH";
        count = Object.keys(allData).filter(key => key.startsWith("FH-")).length;
      }

      const newId = `${prefix}-${String(count + 1).padStart(3, '0')}`;

      const enqueteFeno = {
        anarana,
        province: newProvince,
        region: newRegion,
        district: newDistrict,
        commune: newCommune,
        fokontany: newFokontany.toUpperCase(),
        cin: newCin,
        date_delivrance: newDateDelivrance,
        lieu_delivrance: newLieuDelivrance.toUpperCase(),
        is_duplicata: newIsDuplicata,
        date_duplicata: newIsDuplicata ? newDateDuplicata : null,
        lieu_duplicata: newIsDuplicata ? newLieuDuplicata.toUpperCase() : null,
        telephone: newTelephone,
        tetikasa,
        submitted_at: new Date().toISOString()
      };

      await fetch(`${BASE_URL}/olona/${newId}.json`, {
        method: 'PUT',
        body: JSON.stringify(enqueteFeno)
      });

      setModalAddPerson(false);
      clearForm();
      handleSearchName(); 
    } catch (error) {
      Alert.alert("Olana", "Tsy nahomby ny fampidirana.");
    }
  };

  // ==========================================
  // 6. UPDATE FENO (Momba ny Olona rehetra)
  // ==========================================
  const handleUpdatePerson = async () => {
    if (!newCin) {
      Alert.alert("Hafatra", "Tsy azo avela banga ny CIN!");
      return;
    }

    try {
      const updatedData = {
        province: newProvince,
        region: newRegion,
        district: newDistrict,
        commune: newCommune,
        fokontany: newFokontany.toUpperCase(),
        cin: newCin,
        date_delivrance: newDateDelivrance,
        lieu_delivrance: newLieuDelivrance.toUpperCase(),
        is_duplicata: newIsDuplicata,
        date_duplicata: newIsDuplicata ? newDateDuplicata : null,
        lieu_duplicata: newIsDuplicata ? newLieuDuplicata.toUpperCase() : null,
        telephone: newTelephone
      };

      await fetch(`${BASE_URL}/olona/${selectedPersonId}.json`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData)
      });

      setModalEditPerson(false);
      clearForm();
      handleSearchName();
      Alert.alert("Fandresena", "Tafiditra tsara ny fanovana!");
    } catch (error) {
      Alert.alert("Olana", "Tsy nahomby ny fanovana.");
    }
  };

  const clearForm = () => {
    setNewAnarana(""); setNewProvince(""); setNewRegion(""); setNewDistrict(""); 
    setNewCommune(""); setNewFokontany(""); setNewCin(""); setNewDateDelivrance(""); 
    setNewLieuDelivrance(""); setNewIsDuplicata(false); setNewDateDuplicata(""); 
    setNewLieuDuplicata(""); setNewTelephone(""); setNewTetikasa("");
    setSelectedPersonId("");
  };

  // ==========================================
  // DROPDOWN CASCADING LOGIC (Sivana mifandray)
  // ==========================================
  const openGenericDropdown = (type) => {
    setCurrentDropdownType(type);
    if (type === "province") {
      setGenericDropdownList(Object.keys(madagascarData));
      setModalSelectGeneric(true);
    } else if (type === "region") {
      if (!newProvince) {
        Alert.alert("Hafatra", "Misafidiana Faritany / Province aloha!");
        return;
      }
      setGenericDropdownList(Object.keys(madagascarData[newProvince] || {}));
      setModalSelectGeneric(true);
    } else if (type === "district") {
      if (!newRegion) {
        Alert.alert("Hafatra", "Misafidiana Faritra / Région aloha!");
        return;
      }
      setGenericDropdownList(Object.keys(madagascarData[newProvince]?.[newRegion] || {}));
      setModalSelectGeneric(true);
    } else if (type === "commune") {
      if (!newDistrict) {
        Alert.alert("Hafatra", "Misafidiana Distrika / District aloha!");
        return;
      }
      setGenericDropdownList(madagascarData[newProvince]?.[newRegion]?.[newDistrict] || []);
      setModalSelectGeneric(true);
    } else if (type === "tetikasa") {
      setGenericDropdownList(["VAROTRA", "FAMBOLENA", "ASA TANANA", "FIOMPIANA KISOA", "FIOMPIANA AKOHO", "FIOMPIANA GANA", "FIOMPIANA GISA", "FIOMPIANA HAFA"]);
      setModalSelectGeneric(true);
    }
  };

  const handleSelectGenericItem = (item) => {
    if (currentDropdownType === "province") {
      setNewProvince(item);
      setNewRegion(""); setNewDistrict(""); setNewCommune(""); // Clear ny ambany rehetra rehefa miova ny ambony
    } else if (currentDropdownType === "region") {
      setNewRegion(item);
      setNewDistrict(""); setNewCommune("");
    } else if (currentDropdownType === "district") {
      setNewDistrict(item);
      setNewCommune("");
    } else if (currentDropdownType === "commune") {
      setNewCommune(item);
    } else if (currentDropdownType === "tetikasa") {
      setNewTetikasa(item);
    }
    setModalSelectGeneric(false);
  };

  // ==========================================
  // 7. ADMIN PANEL
  // ==========================================
  const handleLoadUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users.json`);
      const users = await response.json();
      if (!users) {
        setUsersList([]);
        return;
      }
      const tempUsers = Object.keys(users).map(key => ({ id: key, ...users[key] }));
      setUsersList(tempUsers);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (currentScreen === "admin_panel") {
      handleLoadUsers();
    }
  }, [currentScreen]);

  const handleDeleteUser = async (uId) => {
    try {
      await fetch(`${BASE_URL}/users/${uId}.json`, { method: 'DELETE' });
      handleLoadUsers();
    } catch (error) {
      Alert.alert("Olana", "Tsy voafafa ilay mpampiasa.");
    }
  };

  const handleCreateUser = async () => {
    const u = newUsername.toLowerCase().trim();
    const p = newUserPassword.trim();
    const r = newUserRole.toUpperCase().trim();

    if (u && p && r) {
      try {
        await fetch(`${BASE_URL}/users/${u}.json`, {
          method: 'PUT',
          body: JSON.stringify({ password: p, role: r })
        });
        setModalAddUser(false);
        setNewUsername(""); setNewUserPassword(""); setNewUserRole("");
        handleLoadUsers();
      } catch (error) {
        Alert.alert("Olana", "Tsy nahomby ny famoronana.");
      }
    }
  };

  const handleLogout = () => {
    setUserRole(""); setSearchQuery(""); setPeopleList([]);
    setUsername(""); setPassword(""); setCurrentScreen("login");
  };

  // ==========================================
  // SCREENS CODE
  // ==========================================

  // --- A. SPLASH SCREEN ---
  if (currentScreen === "splash") {
    return (
      <View style={styles.containerSplash}>
        <Animated.Image 
          source={require('./assets/logo.png')} 
          style={[styles.splashLogo, { opacity: fadeLogo }]} 
        />
        <Animated.Text style={[styles.splashText, { opacity: fadeText }]}>
          AMM CONNECT
        </Animated.Text>
        <Animated.Text style={[styles.splashAssoc, { opacity: fadeAssoc }]}>
          Association Malagasy Miray
        </Animated.Text>
      </View>
    );
  }

  // --- B. LOGIN SCREEN ---
  if (currentScreen === "login") {
    return (
      <View style={styles.containerLogin}>
        <View style={styles.haingoCircle} />
        
        <View style={styles.cardLogin}>
          <Image 
            source={require('./assets/logo2.png')} 
            style={styles.loginLogo} 
          />
          <Text style={styles.loginTitle}>AMM CONNECT</Text>
          <Text style={styles.loginSubtitle}>Association Malagasy Miray</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput 
              style={styles.inputField} 
              placeholder="Anaran'ny mpampiasa"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput 
              style={styles.inputField} 
              placeholder="Teny miafina"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isLoading && <ActivityIndicator size="small" color="#0d3373" style={{ marginVertical: 10 }} />}

          <TouchableOpacity style={styles.btnLogin} onPress={handleVerifyLogin} disabled={isLoading}>
            <Text style={styles.btnText}>HIDITRA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setCurrentScreen("register")}>
            <Text style={{ color: '#0d3373', fontWeight: '500' }}>Tsy manana kaonty? Misoratra anarana</Text>
          </TouchableOpacity>

          <Text style={styles.loginDate}>Mise à jour: 20 mai 2026</Text>
        </View>
        <Text style={styles.sonia}>© 2026 RFC _ R.Digitale AMM</Text>
      </View>
    );
  }

  // --- C. REGISTER SCREEN ---
  if (currentScreen === "register") {
    return (
      <View style={styles.containerLogin}>
        <View style={styles.cardLogin}>
          <Text style={[styles.loginTitle, { marginBottom: 20 }]}>Fisoratana Anarana Vaovao</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.inputField} placeholder="Username vaovao" value={regUsername} onChangeText={setRegUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-plus-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.inputField} placeholder="Password vaovao" secureTextEntry={true} value={regPassword} onChangeText={setRegPassword} />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="key-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.inputField} placeholder="Token nomen'ny Admin (6 litera)" value={regToken} onChangeText={setRegToken} />
          </View>

          {isLoading && <ActivityIndicator size="small" color="#00cc66" style={{ marginVertical: 10 }} />}

          <TouchableOpacity style={[styles.btnLogin, { backgroundColor: '#00cc66' }]} onPress={handleRegister} disabled={isLoading}>
            <Text style={styles.btnText}>HAFORONA NY KAONTY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setCurrentScreen("login")}>
            <Text style={{ color: '#666' }}>Hiverina hiditra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- D. MAIN SCREEN ---
  if (currentScreen === "main") {
    return (
      <View style={styles.containerMain}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>AMM - Fikarohana</Text>
          <View style={styles.appBarActions}>
            <TouchableOpacity onPress={() => {
              if (userRole === "ADMIN") setCurrentScreen("admin_panel");
              else Alert.alert("Fandrarana", "Admin ihany no afaka miditra!");
            }} style={{ marginRight: 15 }}>
              <MaterialCommunityIcons name="account-cog" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <MaterialCommunityIcons name="logout-variant" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchCard}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" style={{ marginRight: 10 }} />
          <TextInput 
            style={{ flex: 1, fontSize: 16 }}
            placeholder="Tadiavo anarana..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchName}
          />
        </View>

        <ScrollView style={styles.scrollViewStyle}>
          {peopleList.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.customPersonCard}
              onPress={() => {
                setSelectedPersonId(item.id);
                setNewAnarana(item.anarana || "");
                setNewProvince(item.province || "");
                setNewRegion(item.region || "");
                setNewDistrict(item.district || "");
                setNewCommune(item.commune || "");
                setNewFokontany(item.fokontany || "");
                setNewCin(item.cin || "");
                setNewDateDelivrance(item.date_delivrance || "");
                setNewLieuDelivrance(item.lieu_delivrance || "");
                setNewIsDuplicata(item.is_duplicata || false);
                setNewDateDuplicata(item.date_duplicata || "");
                setNewLieuDuplicata(item.lieu_duplicata || "");
                setNewTelephone(item.telephone || "");
                setModalEditPerson(true);
              }}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={40} color="#0052cc" />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.id} | {item.anarana}</Text>
                <Text style={{ color: '#333', fontSize: 14 }}>Toerana: {item.province} - {item.district} - {item.commune}</Text>
                <Text style={{ color: '#555', fontSize: 14 }}>Fokontany: {item.fokontany} | Tel: {item.telephone || "Tsy misy"}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(userRole === "ADMIN" || userRole === "ADHERENT") && (
          <TouchableOpacity style={styles.fab} onPress={() => { clearForm(); setModalAddPerson(true); }}>
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ================= MODAL ADD PERSON (FORMULAIRE FENO) ================= */}
        <Modal visible={modalAddPerson} animationType="slide" transparent={true}>
          <View style={styles.modalCentered}>
            <View style={[styles.modalCard, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>Enquête sur Terrain feno</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.formMiniTitle}>Momba ny olona sy ny Tetikasa</Text>
                <TextInput style={styles.modalInput} placeholder="Anarana feno" value={newAnarana} onChangeText={setNewAnarana} />
                
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("tetikasa")}>
                  <Text style={{ color: newTetikasa ? '#000' : '#888' }}>{newTetikasa || "Tetikasa (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <Text style={styles.formMiniTitle}>Toerana (Sivana mifandray)</Text>
                
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("province")}>
                  <Text style={{ color: newProvince ? '#000' : '#888' }}>{newProvince || "Faritany / Province (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("region")}>
                  <Text style={{ color: newRegion ? '#000' : '#888' }}>{newRegion || "Faritra / Région (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("district")}>
                  <Text style={{ color: newDistrict ? '#000' : '#888' }}>{newDistrict || "Distrika / District (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("commune")}>
                  <Text style={{ color: newCommune ? '#000' : '#888' }}>{newCommune || "Kaominina / Commune (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TextInput style={styles.modalInput} placeholder="Fokontany" value={newFokontany} onChangeText={setNewFokontany} />

                <Text style={styles.formMiniTitle}>Momba ny CIN (Sivana Daty JJ/MM/AAAA)</Text>
                <TextInput style={styles.modalInput} placeholder="Nomeraon'ny CIN" keyboardType="numeric" value={newCin} onChangeText={setNewCin} />
                <TextInput 
                  style={styles.modalInput} 
                  placeholder="Daty namoahana (JJ/MM/AAAA)" 
                  keyboardType="numeric"
                  value={newDateDelivrance} 
                  onChangeText={(t) => setNewDateDelivrance(format_JJ_MM_AAAA(t))} 
                />
                <TextInput style={styles.modalInput} placeholder="Toerana namoahana azy" value={newLieuDelivrance} onChangeText={setNewLieuDelivrance} />

                <View style={styles.switchContainer}>
                  <Text style={{ fontSize: 15, color: '#4a5568' }}>Duplicata ve ilay CIN?</Text>
                  <Switch value={newIsDuplicata} onValueChange={setNewIsDuplicata} />
                </View>

                {newIsDuplicata && (
                  <View>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Daty Duplicata (JJ/MM/AAAA)" 
                      keyboardType="numeric"
                      value={newDateDuplicata} 
                      onChangeText={(t) => setNewDateDuplicata(format_JJ_MM_AAAA(t))} 
                    />
                    <TextInput style={styles.modalInput} placeholder="Toerana Duplicata" value={newLieuDuplicata} onChangeText={setNewLieuDuplicata} />
                  </View>
                )}

                <TextInput style={styles.modalInput} placeholder="Laharana Telefaonina" keyboardType="phone-pad" value={newTelephone} onChangeText={setNewTelephone} />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setModalAddPerson(false)} style={styles.btnFlat}><Text style={{ color: '#666' }}>HAKATONA</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSaveNewPerson} style={styles.btnRaised}><Text style={{ color: '#fff' }}>TEHIRIZINA</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= MODAL EDIT PERSON FENO ================= */}
        <Modal visible={modalEditPerson} animationType="slide" transparent={true}>
          <View style={styles.modalCentered}>
            <View style={[styles.modalCard, { maxHeight: '90%' }]}>
              <Text style={styles.modalTitle}>Hanova mombamomba ny Enquête ({selectedPersonId})</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Anarana: {newAnarana}</Text>

                <Text style={styles.formMiniTitle}>Toerana Vaovao (Sivana mifandray)</Text>
                
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("province")}>
                  <Text style={{ color: newProvince ? '#000' : '#888' }}>{newProvince || "Faritany / Province (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("region")}>
                  <Text style={{ color: newRegion ? '#000' : '#888' }}>{newRegion || "Faritra / Région (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("district")}>
                  <Text style={{ color: newDistrict ? '#000' : '#888' }}>{newDistrict || "Distrika / District (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("commune")}>
                  <Text style={{ color: newCommune ? '#000' : '#888' }}>{newCommune || "Kaominina / Commune (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <TextInput style={styles.modalInput} placeholder="Fokontany" value={newFokontany} onChangeText={setNewFokontany} />

                <Text style={styles.formMiniTitle}>Momba ny CIN (Sivana Daty JJ/MM/AAAA)</Text>
                <TextInput style={styles.modalInput} placeholder="Nomeraon'ny CIN" keyboardType="numeric" value={newCin} onChangeText={setNewCin} />
                <TextInput 
                  style={styles.modalInput} 
                  placeholder="Daty namoahana (JJ/MM/AAAA)" 
                  keyboardType="numeric"
                  value={newDateDelivrance} 
                  onChangeText={(t) => setNewDateDelivrance(format_JJ_MM_AAAA(t))} 
                />
                <TextInput style={styles.modalInput} placeholder="Toerana namoahana azy" value={newLieuDelivrance} onChangeText={setNewLieuDelivrance} />

                <View style={styles.switchContainer}>
                  <Text style={{ fontSize: 15, color: '#4a5568' }}>Duplicata ve ilay CIN?</Text>
                  <Switch value={newIsDuplicata} onValueChange={setNewIsDuplicata} />
                </View>

                {newIsDuplicata && (
                  <View>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Daty Duplicata (JJ/MM/AAAA)" 
                      keyboardType="numeric"
                      value={newDateDuplicata} 
                      onChangeText={(t) => setNewDateDuplicata(format_JJ_MM_AAAA(t))} 
                    />
                    <TextInput style={styles.modalInput} placeholder="Toerana Duplicata" value={newLieuDuplicata} onChangeText={setNewLieuDuplicata} />
                  </View>
                )}

                <TextInput style={styles.modalInput} placeholder="Laharana Telefaonina" keyboardType="phone-pad" value={newTelephone} onChangeText={setNewTelephone} />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setModalEditPerson(false)} style={styles.btnFlat}><Text style={{ color: '#666' }}>HAKATONA</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleUpdatePerson} style={styles.btnRaised}><Text style={{ color: '#fff' }}>OK HANOVA</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= MODAL DROPDOWN IOMBONANA (GENERIC) ================= */}
        <Modal visible={modalSelectGeneric} transparent={true} animationType="fade">
          <View style={styles.modalCenteredGrey}>
            <View style={styles.dropdownContainer}>
              <Text style={{ fontWeight: 'bold', padding: 10, color: '#ff9900', textTransform: 'uppercase', textAlign: 'center' }}>
                Safidio ny {currentDropdownType}
              </Text>
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={true}>
                {genericDropdownList.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => handleSelectGenericItem(item)}>
                    <Text style={{ fontSize: 16 }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setModalSelectGeneric(false)} style={{ alignItems: 'center', padding: 12, marginTop: 5 }}>
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Hiverina</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    );
  }

  // --- E. ADMIN PANEL SCREEN ---
  if (currentScreen === "admin_panel") {
    return (
      <View style={styles.containerMain}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => setCurrentScreen("main")}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.appBarTitle, { marginLeft: 15 }]}>Fitantanana Mpampiasa</Text>
        </View>

        <Text style={styles.adminSectionTitle}>LISITRY NY MPAMPIASA</Text>

        <ScrollView style={styles.scrollViewStyle}>
          {usersList.map((u) => (
            <View key={u.id} style={styles.userListItem}>
              <View style={styles.rowCenter}>
                <MaterialCommunityIcons name="shield-account" size={24} color="#0047b3" style={{ marginRight: 15 }} />
                <Text style={{ fontSize: 16, fontWeight: '500' }}>{u.id.toUpperCase()} ({u.role})</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteUser(u.id)}>
                <MaterialCommunityIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.adminBottomBar}>
          <TouchableOpacity style={styles.btnAdminAdd} onPress={() => setModalAddUser(true)}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>MANAMPY MPAMPIASA VAOVAO</Text>
          </TouchableOpacity>
        </View>

        {/* ================= MODAL ADD USER ================= */}
        <Modal visible={modalAddUser} animationType="slide" transparent={true}>
          <View style={styles.modalCentered}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New User</Text>
              <TextInput style={styles.modalInput} placeholder="Username" value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
              <TextInput style={styles.modalInput} placeholder="Password" value={newUserPassword} onChangeText={setNewUserPassword} />
              
              <TouchableOpacity style={[styles.modalInput, styles.rowBetween]} onPress={() => setModalSelectRole(true)}>
                <Text style={{ color: newUserRole ? '#000' : '#888' }}>{newUserRole || "Role (Kitiho)"}</Text>
                <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setModalAddUser(false)} style={styles.btnFlat}><Text style={{ color: '#666' }}>HAKATONA</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleCreateUser} style={styles.btnRaised}><Text style={{ color: '#fff' }}>CREATE</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= DROPDOWN ROLES MENU ================= */}
        <Modal visible={modalSelectRole} transparent={true} animationType="fade">
          <View style={styles.modalCenteredGrey}>
            <ScrollView style={styles.dropdownContainerScroll}>
              {["ADHERENT", "RESP. VAROTRA", "RESP. FAMBOLENA", "RESP. ASA TANANA", "RESP. FIOMPIANA KISOA", "RESP. FIOMPIANA AKOHO", "RESP. FIOMPIANA GANA", "RESP. FIOMPIANA GISA", "RESP. FIOMPIANA HAFA", "ADMIN"].map(r => (
                <TouchableOpacity key={r} style={styles.dropdownItem} onPress={() => { setNewUserRole(r); setModalSelectRole(false); }}>
                  <Text style={{ fontSize: 15 }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

      </View>
    );
  }
}

// ==========================================
// STYLES MATIHANINA VOADIO (KIDIA MAINTY NY SORATRA REHETRA)
// ==========================================
const styles = StyleSheet.create({
  containerSplash: { flex: 1, backgroundColor: '#0d1b2a', justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 140, height: 140, marginBottom: 20, borderRadius: 20 },
  splashText: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  splashAssoc: { fontSize: 16, color: '#ccc' },

  containerLogin: { flex: 1, backgroundColor: '#ebf0f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  haingoCircle: { position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#e0e6ed' },
  cardLogin: { backgroundColor: '#fff', width: width * 0.88, padding: 20, borderRadius: 25, elevation: 3, alignItems: 'center' },
  loginLogo: { width: 90, height: 90, marginBottom: 10, borderRadius: 15 },
  loginTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  loginSubtitle: { fontSize: 12, color: '#666', marginBottom: 20, marginTop: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginVertical: 8, height: 50, width: '100%' },
  inputIcon: { marginRight: 10 },
  
  // AHITSY 1: Terena ho mainty ny soratra soratana eo amin'ny Login
  inputField: { flex: 1, height: '100%', fontSize: 15, color: '#000000' },
  
  btnLogin: { backgroundColor: '#0d3373', width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginDate: { marginTop: 15, fontSize: 11, color: '#aaa' },
  sonia: { position: 'absolute', bottom: 30, fontSize: 12, color: '#aaa' },

  containerMain: { flex: 1, backgroundColor: '#f5f5f5' },
  appBar: { backgroundColor: '#0047b3', height: 90, paddingTop: 40, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  appBarTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  appBarActions: { flexDirection: 'row' },
  searchCard: { backgroundColor: '#fff', height: 55, margin: 10, borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  scrollViewStyle: { flex: 1, padding: 10 },
  customPersonCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginVertical: 6, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#ff9900', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },

  adminSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#666', textAlign: 'center', marginVertical: 15 },
  userListItem: { backgroundColor: '#fff', padding: 15, marginVertical: 5, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  adminBottomBar: { backgroundColor: '#fff', height: 80, padding: 15, justifyContent: 'center', alignItems: 'center' },
  btnAdminAdd: { backgroundColor: '#0047b3', width: '90%', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  modalCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCenteredGrey: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', width: '88%', padding: 20, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#0047b3' },
  formMiniTitle: { fontSize: 13, fontWeight: 'bold', color: '#ff9900', marginTop: 14, textTransform: 'uppercase' },
  
  // AHITSY 2: Terena ho mainty ny soratra ao amin'ny Input-n'ny Form (Anarana, Fanampiny, sns)
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8, fontSize: 15, marginVertical: 5, color: '#000000' },
  
  dropdownSelector: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 12, marginVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  btnFlat: { padding: 10, marginRight: 10 },
  btnRaised: { backgroundColor: '#0047b3', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  dropdownContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 12, padding: 15, elevation: 5 },
  dropdownContainerScroll: { backgroundColor: '#fff', width: '75%', maxHeight: 300, borderRadius: 10, padding: 10, elevation: 5 },
  
  // AHITSY 3: Terena ho mainty ny soratra ao anatin'ny latsak'alina (Dropdown Item)
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee', color: '#000000' },
  
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
