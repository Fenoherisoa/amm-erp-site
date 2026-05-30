import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, Animated, Alert, Dimensions, Modal, Switch,
  KeyboardAvoidingView, Platform, StatusBar, FlatList // Nampiana KeyboardAvoidingView sy Platform ary StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { madagascarData } from './madagascarData'; 

const { width } = Dimensions.get('window');

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
  const [currentScreen, setCurrentScreen] = useState("splash");
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadeText = useRef(new Animated.Value(0)).current;
  const fadeAssoc = useRef(new Animated.Value(0)).current;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regToken, setRegToken] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [peopleList, setPeopleList] = useState([]);
  const [modalAddPerson, setModalAddPerson] = useState(false);
  const [modalEditPerson, setModalEditPerson] = useState(false);
  
  const [currentDropdownType, setCurrentDropdownType] = useState(""); 
  const [modalSelectGeneric, setModalSelectGeneric] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [genericDropdownList, setGenericDropdownList] = useState([]);

  const [personData, setPersonData] = useState({
    anarana: "", province: "", region: "", district: "", commune: "",
    fokontany: "", cin: "", date_delivrance: "", lieu_delivrance: "",
    is_duplicata: false, date_duplicata: "", lieu_duplicata: "",
    telephone: "", tetikasa: ""
  });
  
  const [selectedPersonId, setSelectedPersonId] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [modalAddUser, setModalAddUser] = useState(false);
  const [modalSelectRole, setModalSelectRole] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("");

  const format_JJ_MM_AAAA = (text) => {
    let cleaned = text.replace(/\D/g, ''); 
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
    }
    return formatted;
  };

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

  useEffect(() => {
    const handler = setTimeout(() => {
      const filtered = allMembers.filter(p => 
        p.anarana.toUpperCase().includes(searchQuery.toUpperCase()) || 
        (p.telephone || "").includes(searchQuery)
      );
      setPeopleList(filtered);
    }, 300); // Miandry 300ms vao manivana

    return () => clearTimeout(handler);
  }, [searchQuery, allMembers]);

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

  // Apetraho ireto state ireto
  const [allMembers, setAllMembers] = useState([]); // Lisitra feno

  // Fetch data indray mandeha monja rehefa mi-load ny screen
  useEffect(() => {
    if (currentScreen === "main") {
      loadAllData();
    }
  }, [currentScreen]);

  const loadAllData = async () => {
    const res = await fetch(`${BASE_URL}/olona.json`);
    const data = await res.json() || {};
    const formatted = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    setAllMembers(formatted);
    setPeopleList(formatted); // Asio default lisitra feno
  };

  const handleFilterChange = (text) => {
    setSearchQuery(text);
    const query = text.toUpperCase().trim();
    const cleanRole = userRole.replace("RESP. ", "").trim();
    const tetikasaFantatra = ["VAROTRA", "FAMBOLENA", "ASA TANANA", "FIOMPIANA KISOA", "FIOMPIANA AKOHO", "FIOMPIANA GANA", "FIOMPIANA GISA"];

    const filtered = allMembers.filter(p => {
      // Fepetra: Mitady amin'ny Anarana NA Telefaonina
      const matchesQuery = (p.anarana?.toUpperCase().includes(query) || p.telephone?.includes(query));
      
      // Fepetra: Role (Ampiana ny EDITEUR)
      let hasAccess = false;
      if (["ADMIN", "ADHERENT", "EDITEUR"].includes(userRole.toUpperCase())) {
        hasAccess = true;
      } else if (cleanRole === "FIOMPIANA HAFA") {
        hasAccess = (p.id.startsWith("FH-") || !tetikasaFantatra.includes((p.tetikasa || "").toUpperCase()));
      } else {
        hasAccess = (cleanRole === (p.tetikasa || "").toUpperCase());
      }

      return matchesQuery && hasAccess;
    });

    setPeopleList(filtered);
  };

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

  const handleSaveNewPerson = async () => {
    const { anarana, tetikasa, cin } = personData;
    if (!anarana || !tetikasa || !cin) {
      Alert.alert("Hafatra", "Fenoy ny Anarana, Tetikasa, ary CIN!");
      return;
    }

    setIsLoading(true);
    try {
      // Mampiasa ny allMembers efa misy fa tsy manao fetch intsony
      const lisitraMazava = ["VAROTRA", "FAMBOLENA", "ASA TANANA", "FIOMPIANA KISOA", "FIOMPIANA AKOHO", "FIOMPIANA GANA", "FIOMPIANA GISA"];
      
      let prefix = lisitraMazava.includes(tetikasa.toUpperCase()) ? (PROJECT_PREFIX[tetikasa.toUpperCase()] || "P") : "FH";
      const count = allMembers.filter(p => p.id.startsWith(prefix)).length;
      const newId = `${prefix}-${String(count + 1).padStart(3, '0')}`;

      const enqueteFeno = { ...personData, submitted_at: new Date().toISOString() };

      await fetch(`${BASE_URL}/olona/${newId}.json`, { method: 'PUT', body: JSON.stringify(enqueteFeno) });
      
      setModalAddPerson(false);
      setPersonData({ anarana: "", province: "", region: "", district: "", commune: "", fokontany: "", cin: "", date_delivrance: "", lieu_delivrance: "", is_duplicata: false, date_duplicata: "", lieu_duplicata: "", telephone: "", tetikasa: "" });
      loadAllData(); // Refresh list
    } catch (e) {
      Alert.alert("Olana", "Tsy tafiditra ny data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePerson = async () => {
    // 1. Ampiasao ny personData.cin fa tsy newCin
    if (!personData.cin) {
      Alert.alert("Hafatra", "Tsy azo avela banga ny CIN!");
      return;
    }

    try {
      // 2. Mamorona updatedData mivantana avy amin'ny personData
      const updatedData = {
        province: personData.province,
        region: personData.region,
        district: personData.district,
        commune: personData.commune,
        fokontany: (personData.fokontany || "").toUpperCase(),
        cin: personData.cin,
        date_delivrance: personData.date_delivrance,
        lieu_delivrance: (personData.lieu_delivrance || "").toUpperCase(),
        is_duplicata: personData.is_duplicata,
        date_duplicata: personData.is_duplicata ? personData.date_duplicata : null,
        lieu_duplicata: personData.is_duplicata ? (personData.lieu_duplicata || "").toUpperCase() : null,
        telephone: personData.telephone,
        tetikasa: personData.tetikasa // Aza adino raha ilaina
      };

      await fetch(`${BASE_URL}/olona/${selectedPersonId}.json`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData)
      });

      setModalEditPerson(false);
      
      // 3. Raha ny clearForm dia manafotsy ny personData
      setPersonData({
        anarana: "", province: "", region: "", district: "", commune: "",
        fokontany: "", cin: "", date_delivrance: "", lieu_delivrance: "",
        is_duplicata: false, date_duplicata: "", lieu_duplicata: "",
        telephone: "", tetikasa: ""
      });
      
      handleSearchName();
      Alert.alert("Fandresena", "Tafiditra tsara ny fanovana!");
    } catch (error) {
      Alert.alert("Olana", "Tsy nahomby ny fanovana.");
    }
  };

  const clearForm = () => {
    setPersonData({
      anarana: "", 
      province: "", 
      region: "", 
      district: "", 
      commune: "",
      fokontany: "", 
      cin: "", 
      date_delivrance: "", 
      lieu_delivrance: "",
      is_duplicata: false, 
      date_duplicata: "", 
      lieu_duplicata: "",
      telephone: "", 
      tetikasa: ""
    });
  };

  const openGenericDropdown = (type) => {
    setCurrentDropdownType(type);
    setFilterText("");

    // Ampiasao ny personData fa tsy ny newProvince/newRegion intsony
    const { province, region, district } = personData;

    if (type === "province") {
      setGenericDropdownList(Object.keys(madagascarData));
      setModalSelectGeneric(true);
    } else if (type === "region") {
      if (!province) {
        Alert.alert("Hafatra", "Misafidiana Faritany / Province aloha!");
        return;
      }
      setGenericDropdownList(Object.keys(madagascarData[province] || {}));
      setModalSelectGeneric(true);
    } else if (type === "district") {
      if (!region) {
        Alert.alert("Hafatra", "Misafidiana Faritra / Région aloha!");
        return;
      }
      setGenericDropdownList(Object.keys(madagascarData[province]?.[region] || {}));
      setModalSelectGeneric(true);
    } else if (type === "commune") {
      if (!district) {
        Alert.alert("Hafatra", "Misafidiana Distrika / District aloha!");
        return;
      }
      setGenericDropdownList(madagascarData[province]?.[region]?.[district] || []);
      setModalSelectGeneric(true);
    } else if (type === "tetikasa") {
      setGenericDropdownList(["VAROTRA", "FAMBOLENA", "ASA TANANA", "FIOMPIANA KISOA", "FIOMPIANA AKOHO", "FIOMPIANA GANA", "FIOMPIANA GISA", "FIOMPIANA HAFA"]);
      setModalSelectGeneric(true);
    }
  };

  const handleSelectGenericItem = (item) => {
    setPersonData(prev => {
      let newData = { ...prev };
      newData[currentDropdownType] = item;

      // Fafana (reset) ireo saha mifandray raha misy ovaina
      if (currentDropdownType === "province") {
        newData.region = ""; newData.district = ""; newData.commune = "";
      } else if (currentDropdownType === "region") {
        newData.district = ""; newData.commune = "";
      } else if (currentDropdownType === "district") {
        newData.commune = "";
      }
      return newData;
    });
    setModalSelectGeneric(false);
  };

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

  // --- A. SPLASH SCREEN ---
  if (currentScreen === "splash") {
    return (
      <View style={styles.containerSplash}>
        <StatusBar barStyle="light-content" backgroundColor="#0d1b2a" />
        <Animated.Image 
          source={require('./assets/logo2.png')} 
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.containerLogin}>
          <StatusBar barStyle="dark-content" backgroundColor="#ebf0f5" />
          <View style={styles.haingoCircle} />
          
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
            <View style={styles.cardLogin}>
              <Image 
                source={require('./assets/logo.png')} 
                style={styles.loginLogo} 
              />
              <Text style={styles.loginTitle}>AMM CONNECT</Text>
              <Text style={styles.loginSubtitle}>Association Malagasy Miray</Text>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.inputField} 
                  placeholder="Anaran'ny mpampiasa"
                  placeholderTextColor="#888"
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
                  placeholderTextColor="#888"
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- C. REGISTER SCREEN ---
  if (currentScreen === "register") {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.containerLogin}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
            <View style={styles.cardLogin}>
              <Text style={[styles.loginTitle, { marginBottom: 20, color: '#333' }]}>Fisoratana Anarana Vaovao</Text>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-plus-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.inputField} placeholder="Username vaovao" placeholderTextColor="#888" value={regUsername} onChangeText={setRegUsername} autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-plus-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.inputField} placeholder="Password vaovao" placeholderTextColor="#888" secureTextEntry={true} value={regPassword} onChangeText={setRegPassword} />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="key-outline" size={24} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.inputField} placeholder="Token nomen'ny Admin (6 litera)" placeholderTextColor="#888" value={regToken} onChangeText={setRegToken} />
              </View>

              {isLoading && <ActivityIndicator size="small" color="#00cc66" style={{ marginVertical: 10 }} />}

              <TouchableOpacity style={[styles.btnLogin, { backgroundColor: '#00cc66' }]} onPress={handleRegister} disabled={isLoading}>
                <Text style={styles.btnText}>HAFORONA NY KAONTY</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setCurrentScreen("login")}>
                <Text style={{ color: '#666', fontWeight: '500' }}>Hiverina hiditra</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- D. MAIN SCREEN ---
  if (currentScreen === "main") {
    return (
      <View style={styles.containerMain}>
        <StatusBar barStyle="light-content" backgroundColor="#0047b3" />
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
            style={{ flex: 1, fontSize: 16, color: '#000000' }}
            placeholder="Tadiavo anarana..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleFilterChange}
            onSubmitEditing={handleSearchName}
          />
        </View>

        <FlatList
          data={peopleList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.customPersonCard}
              onPress={() => {
                setSelectedPersonId(item.id);
                setPersonData(item); // Fenoina mivantana ny form
                setModalEditPerson(true);
              }}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={40} color="#0052cc" />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.id} | {item.anarana}</Text>
                <Text>Toerana: {item.province}</Text>
              </View>
            </TouchableOpacity>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />

        {(userRole === "ADMIN" || userRole === "ADHERENT") && (
          <TouchableOpacity style={styles.fab} onPress={() => { clearForm(); setModalAddPerson(true); }}>
            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ================= MODAL ADD PERSON ================= */}
        <Modal visible={modalAddPerson} animationType="slide" transparent={true}>
          <View style={styles.modalCentered}>
            <KeyboardAvoidingView 
              style={{ width: '100%', alignItems: 'center' }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={[styles.modalCard, { maxHeight: '90%' }]}>
                <Text style={styles.modalTitle}>Enquête sur Terrain feno</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={styles.formMiniTitle}>Momba ny olona sy ny Tetikasa</Text>
                  
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Anarana feno" 
                    placeholderTextColor="#888" 
                    value={personData.anarana} 
                    onChangeText={(t) => setPersonData({...personData, anarana: t})} 
                  />
                  
                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("tetikasa")}>
                    <Text style={{ color: '#000000', fontSize: 15 }}>{personData.tetikasa || "Tetikasa (Kitiho)"}</Text>
                    <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.formMiniTitle}>Toerana (Sivana mifandray)</Text>
                  
                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("province")}>
                    <Text style={{ color: '#000000', fontSize: 15 }}>{personData.province || "Faritany / Province (Kitiho)"}</Text>
                    <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("region")}>
                    <Text style={{ color: '#000000', fontSize: 15 }}>{personData.region || "Faritra / Région (Kitiho)"}</Text>
                    <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("district")}>
                    <Text style={{ color: '#000000', fontSize: 15 }}>{personData.district || "Distrika / District (Kitiho)"}</Text>
                    <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openGenericDropdown("commune")}>
                    <Text style={{ color: '#000000', fontSize: 15 }}>{personData.commune || "Kaominina / Commune (Kitiho)"}</Text>
                    <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>

                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Fokontany" 
                    placeholderTextColor="#888" 
                    value={personData.fokontany} 
                    onChangeText={(t) => setPersonData({...personData, fokontany: t})} 
                  />

                  <Text style={styles.formMiniTitle}>Momba ny CIN (Sivana Daty JJ/MM/AAAA)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Nomeraon'ny CIN" 
                    placeholderTextColor="#888" 
                    keyboardType="numeric" 
                    value={personData.cin} 
                    onChangeText={(t) => setPersonData({...personData, cin: t})} 
                  />
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Daty namoahana (JJ/MM/AAAA)" 
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={personData.date_delivrance} 
                    onChangeText={(t) => setPersonData({...personData, date_delivrance: format_JJ_MM_AAAA(t)})} 
                  />
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Toerana namoahana azy" 
                    placeholderTextColor="#888" 
                    value={personData.lieu_delivrance} 
                    onChangeText={(t) => setPersonData({...personData, lieu_delivrance: t})} 
                  />

                  <View style={styles.switchContainer}>
                    <Text style={{ fontSize: 15, color: '#4a5568' }}>Duplicata ve ilay CIN?</Text>
                    <Switch 
                      value={personData.is_duplicata} 
                      onValueChange={(val) => setPersonData({...personData, is_duplicata: val})} 
                    />
                  </View>

                  {personData.is_duplicata && (
                    <View>
                      <TextInput 
                        style={styles.modalInput} 
                        placeholder="Daty Duplicata (JJ/MM/AAAA)" 
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={personData.date_duplicata} 
                        onChangeText={(t) => setPersonData({...personData, date_duplicata: format_JJ_MM_AAAA(t)})} 
                      />
                      <TextInput 
                        style={styles.modalInput} 
                        placeholder="Toerana Duplicata" 
                        placeholderTextColor="#888" 
                        value={personData.lieu_duplicata} 
                        onChangeText={(t) => setPersonData({...personData, lieu_duplicata: t})} 
                      />
                    </View>
                  )}

                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Laharana Telefaonina" 
                    placeholderTextColor="#888" 
                    keyboardType="phone-pad" 
                    value={personData.telephone} 
                    onChangeText={(t) => setPersonData({...personData, telephone: t})} 
                  />
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setModalAddPerson(false)} style={styles.btnFlat}><Text style={{ color: '#666', fontWeight: 'bold' }}>HAKATONA</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveNewPerson} style={styles.btnRaised}><Text style={{ color: '#fff', fontWeight: 'bold' }}>TEHIRIZINA</Text></TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ================= MODAL EDIT PERSON ================= */}
        <Modal visible={modalEditPerson} animationType="slide" transparent={true}>
          <View style={styles.modalCentered}>
            <KeyboardAvoidingView 
              style={{ width: '100%', alignItems: 'center' }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={[styles.modalCard, { maxHeight: '90%' }]}>
                <Text style={styles.modalTitle}>Hanova mombamomba ny Enquête ({selectedPersonId})</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {/* Anarana dia tsy mila ovaina eto fa aseho fotsiny */}
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
                    Anarana: {personData.anarana}
                  </Text>

                  <Text style={styles.formMiniTitle}>Toerana Vaovao</Text>
                  
                  {["province", "region", "district", "commune"].map((field) => (
                    <TouchableOpacity key={field} style={styles.dropdownSelector} onPress={() => openGenericDropdown(field)}>
                      <Text style={{ color: '#000000', fontSize: 15 }}>
                        {personData[field] || `${field.charAt(0).toUpperCase() + field.slice(1)} (Kitiho)`}
                      </Text>
                      <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  ))}

                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Fokontany" 
                    value={personData.fokontany} 
                    onChangeText={(t) => setPersonData({...personData, fokontany: t})} 
                  />

                  <Text style={styles.formMiniTitle}>Momba ny CIN</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Nomeraon'ny CIN" 
                    keyboardType="numeric" 
                    value={personData.cin} 
                    onChangeText={(t) => setPersonData({...personData, cin: t})} 
                  />
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Daty namoahana (JJ/MM/AAAA)" 
                    keyboardType="numeric"
                    value={personData.date_delivrance} 
                    onChangeText={(t) => setPersonData({...personData, date_delivrance: format_JJ_MM_AAAA(t)})} 
                  />
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Toerana namoahana azy" 
                    value={personData.lieu_delivrance} 
                    onChangeText={(t) => setPersonData({...personData, lieu_delivrance: t})} 
                  />

                  <View style={styles.switchContainer}>
                    <Text style={{ fontSize: 15, color: '#4a5568' }}>Duplicata ve ilay CIN?</Text>
                    <Switch 
                      value={personData.is_duplicata} 
                      onValueChange={(val) => setPersonData({...personData, is_duplicata: val})} 
                    />
                  </View>

                  {personData.is_duplicata && (
                    <View>
                      <TextInput 
                        style={styles.modalInput} 
                        placeholder="Daty Duplicata (JJ/MM/AAAA)" 
                        keyboardType="numeric"
                        value={personData.date_duplicata} 
                        onChangeText={(t) => setPersonData({...personData, date_duplicata: format_JJ_MM_AAAA(t)})} 
                      />
                      <TextInput 
                        style={styles.modalInput} 
                        placeholder="Toerana Duplicata" 
                        value={personData.lieu_duplicata} 
                        onChangeText={(t) => setPersonData({...personData, lieu_duplicata: t})} 
                      />
                    </View>
                  )}

                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Laharana Telefaonina" 
                    keyboardType="phone-pad" 
                    value={personData.telephone} 
                    onChangeText={(t) => setPersonData({...personData, telephone: t})} 
                  />
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setModalEditPerson(false)} style={styles.btnFlat}>
                    <Text style={{ color: '#666', fontWeight: 'bold' }}>HAKATONA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleUpdatePerson} style={styles.btnRaised}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK HANOVA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ================= MODAL DROPDOWN GENERIC ================= */}
        <Modal visible={modalSelectGeneric} transparent={true} animationType="fade">
          <View style={styles.modalCenteredGrey}>
            <View style={styles.dropdownContainer}>
              <Text style={{ fontWeight: 'bold', padding: 10, color: '#ff9900', textTransform: 'uppercase', textAlign: 'center' }}>
                Safidio ny {currentDropdownType}
              </Text>
              
              {/* Eto ny TextInput hanaovana Autocomplete */}
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, margin: 10 }}
                placeholder="Tadiavo..."
                onChangeText={(text) => setFilterText(text)}
                value={filterText}
              />

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={true}>
                {/* Eto no misy ny sivana (filter) */}
                {genericDropdownList
                  .filter(item => item.toLowerCase().includes(filterText.toLowerCase()))
                  .map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        handleSelectGenericItem(item);
                        setFilterText(""); // Reset rehefa avy nifidy
                      }}
                    >
                      <Text style={{ fontSize: 16, color: '#000000' }}>{item}</Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={() => { setModalSelectGeneric(false); setFilterText(""); }} style={{ alignItems: 'center', padding: 12, marginTop: 5 }}>
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
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>{u.id.toUpperCase()} ({u.role})</Text>
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
            <KeyboardAvoidingView 
              style={{ width: '100%', alignItems: 'center' }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>New User</Text>
                <TextInput style={styles.modalInput} placeholder="Username" placeholderTextColor="#888" value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
                <TextInput style={styles.modalInput} placeholder="Password" placeholderTextColor="#888" value={newUserPassword} onChangeText={setNewUserPassword} />
                
                <TouchableOpacity style={[styles.modalInput, styles.rowBetween]} onPress={() => setModalSelectRole(true)}>
                  <Text style={{ color: '#000000' }}>{newUserRole || "Role (Kitiho)"}</Text>
                  <MaterialCommunityIcons name="arrow-down-drop-circle-outline" size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setModalAddUser(false)} style={styles.btnFlat}><Text style={{ color: '#666', fontWeight: 'bold' }}>HAKATONA</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateUser} style={styles.btnRaised}><Text style={{ color: '#fff', fontWeight: 'bold' }}>CREATE</Text></TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ================= DROPDOWN ROLES MENU ================= */}
        <Modal visible={modalSelectRole} transparent={true} animationType="fade">
          <View style={styles.modalCenteredGrey}>
            <ScrollView style={styles.dropdownContainerScroll}>
              {["ADHERENT", "RESP. VAROTRA", "RESP. FAMBOLENA", "RESP. ASA TANANA", "RESP. FIOMPIANA KISOA", "RESP. FIOMPIANA AKOHO", "RESP. FIOMPIANA GANA", "RESP. FIOMPIANA GISA", "RESP. FIOMPIANA HAFA", "ADMIN"].map(r => (
                <TouchableOpacity key={r} style={styles.dropdownItem} onPress={() => { setNewUserRole(r); setModalSelectRole(false); }}>
                  <Text style={{ fontSize: 15, color: '#000000' }}>{r}</Text>
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
// STYLES VOAHITSY MATIHANINA SY MAZAVA
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginVertical: 8, height: 50, width: '100%', backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  inputField: { flex: 1, height: '100%', fontSize: 15, color: '#000000' },
  
  btnLogin: { backgroundColor: '#0d3373', width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginDate: { marginTop: 20, fontSize: 12, color: '#718096', textAlign: 'center', fontWeight: '500' },
  sonia: { marginTop: 25, fontSize: 12, color: '#718096', fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center' },

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
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8, fontSize: 15, marginVertical: 5, color: '#000000', backgroundColor: '#fff' },
  dropdownSelector: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 12, marginVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  btnFlat: { padding: 10, marginRight: 10 },
  btnRaised: { backgroundColor: '#0047b3', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  dropdownContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 12, padding: 15, elevation: 5 },
  dropdownContainerScroll: { backgroundColor: '#fff', width: '75%', maxHeight: 300, borderRadius: 10, padding: 10, elevation: 5 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
