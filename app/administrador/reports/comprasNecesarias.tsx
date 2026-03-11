import { Stack } from "expo-router";
import {
  collection, doc,
  onSnapshot,
  orderBy,
  query, setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";
import { Ingredient } from "../../../src/types";

export default function ComprasNecesarias() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedList, setSavedList] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Ingredient[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Ingredient, "id">),
      }));

      setIngredients(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = doc(db,"adminReports","comprasNecesrias");

    const unsub = onSnapshot(ref,(snap) =>{
      if(snap.exists()){
        const data = snap.data() as {items?:any[]};
        setSavedList(data.items||[]);
      }else{
        setSavedList([]);
      }
    });
    return()=>unsub();
  },[]);

  if (loading) return null;

  // Filter ingredients that need restocking
  const lowStock = ingredients.filter(
    (ing) => ing.stock <= ing.minStock
  );

  // Sort by urgency (lowest stock first)
  lowStock.sort((a, b) => a.stock - b.stock);

  const filteredSearch = useMemo(()=>{
    if (!search.trim()) return [];
    const term=search.toLowerCase();

    return ingredients
    .filter(
      (ing)=>
        ing.name.toLowerCase().includes(term)&&
      !savedList.some((s)=>s.id == ing.id)
    )
    .slice(0,10);
  },[search,ingredients,savedList]);

  const saveList = async(newList:any[])=>{
    const ref=doc(db,"adminReports","comprasNecesarias");
    await setDoc(ref,{items: newList},{merge:true});
  };

  const handleAddManual = (ing:Ingredient)=>{
    const newItem = {
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      stock: ing.stock,
      minStock: ing.minStock,
      addedManually: true,
    };

    const newList = [...savedList, newItem];
    saveList(newList);
    setSearch("");
  };

  const handleRemove = (id:string)=>{
    const newList = savedList.filter((item)=>item.id !== id);
  };

  const mergedList =[
    ...lowStock.filter((ing)=>!savedList.some((s)=>s.id === ing.id)),
    ...savedList,
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Compras Necesarias",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <TextInput
            style={styles.search}
            placeholder="Agregar ingrediente manualmente..."
            placeholderTextColor="#333"
            value={search}
            onChangeText={setSearch}
            />

            {filteredSearch.length>0 &&(
              <View style={styles.searchResults}>
                {filteredSearch.map((ing)=>(
                  <TouchableOpacity
                    key={ing.id}
                    style={styles.searchItem}
                    onPress={()=>handleAddManual(ing)}
                  >
                    <Text style={styles.searchText}>{ing.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {mergedList.length === 0 && (
              <Text style={styles.empty}>No hay ingredientes por comprar</Text>
            )}
            {mergedList.map((ing)=>{
              const suggested = Math.max(ing.minStock - ing.stock,0);

              return(
                <View key={ing.id} style={styles.card}>
                  <Text style={styles.name}>{ing.name}</Text>
                  <Text style={styles.detail}>
                    Inventario actual:{" "}
                    <Text style={styles.bold}>{ing.stock}</Text>{ing.unit}
                  </Text>
                  <Text style={styles.detail}>
                    Inventario minimo:{" "}
                    <Text style={styles.bold}>{ing.minStock}</Text>{ing.unit}
                  </Text>
                  <Text style={styles.urgent}>
                    Compra sugerida:{" "}
                    <Text style={styles.bold}>
                      {suggested} {ing.unit}
                    </Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={()=>handleRemove(ing.id)}
                      >
                        <Text style={styles.buyText}>Comprado</Text>
                    </TouchableOpacity>                  
                </View>
              );
            })}

          
        </ScrollView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  search:{
    backgroundColor:"#fff",
    padding:12,
    borderRadius:8,
    borderWidth:1,
    borderColor:"#ccc",
    fontSize:16,
  },
  searchResults:{
    backgroundColor:"#fff",
    borderRadius:8,
    borderWidth:1,
    borderColor:"#ccc",
    overflow:"hidden",
  },
  searchItem:{
    padding:12,
    borderBottomWidth:1,
    borderBottomColor:"#eee",
  },
  searchText:{
    fontSize:16,
    color:"#333",
  },
  empty: {
    textAlign: "center",
    fontSize: 18,
    color: "#444",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#DDCBAB",
    padding: 16,
    borderRadius: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  detail: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "700",
    color: "#000",
  },
  urgent: {
    marginTop: 8,
    fontSize: 16,
    color: "#8B0000",
    fontWeight: "600",
  },
  buyButton:{
    marginTop:10,
    backgroundColor:"#3A2F2F",
    padding:10,
    borderRadius:8,
  },
  buyText:{
    color:"white",
    textAlign:"center",
    fontWeight:"600",
  }
});
