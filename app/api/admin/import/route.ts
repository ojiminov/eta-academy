import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
//  DATA — Discover School
// ─────────────────────────────────────────────────────────────────────────────

const TEACHERS = [
  { key: "abdusattor", firstName: "Abdusattor", lastName: "",     email: "abdusattor@discover.uz", subjects: ["English"] },
  { key: "doniyor",    firstName: "Doniyor",    lastName: "",     email: "doniyor@discover.uz",    subjects: ["English"] },
  { key: "bekzod",     firstName: "Bekzod",     lastName: "",     email: "bekzod@discover.uz",     subjects: ["English"] },
  { key: "shahnoza",   firstName: "Shahnoza",   lastName: "",     email: "shahnoza@discover.uz",   subjects: ["Russian"] },
  { key: "oisha",      firstName: "Oisha",      lastName: "",     email: "oisha@discover.uz",      subjects: ["English"] },
  { key: "elbek",      firstName: "Elbek",      lastName: "",     email: "elbek@discover.uz",      subjects: ["English"] },
  { key: "navruz",     firstName: "Navruz",     lastName: "",     email: "navruz@discover.uz",     subjects: ["English"] },
  { key: "dilafruz",   firstName: "Dilafruz",   lastName: "",     email: "dilafruz@discover.uz",   subjects: ["English"] },
];

const GROUPS = [
  { key: "inter_ab2",    name: "Inter Ab2",    teacherKey: "abdusattor", level: "INTERMEDIATE",    schedule: "Mon, Wed, Fri 14:30", monthlyFee: 350000, maxStudents: 15 },
  { key: "pre_ab2",      name: "Pre Ab2",      teacherKey: "abdusattor", level: "PRE_INTERMEDIATE", schedule: "Tue, Thu, Sat",       monthlyFee: 300000, maxStudents: 15 },
  { key: "beginner_ab2", name: "Beginner Ab2", teacherKey: "abdusattor", level: "BEGINNER",         schedule: "Tue, Thu, Sat 17:00", monthlyFee: 250000, maxStudents: 12 },
  { key: "kids_ab1",     name: "Kids Ab1",     teacherKey: "abdusattor", level: "ELEMENTARY",       schedule: "Tue, Thu, Sat 14:30", monthlyFee: 250000, maxStudents: 15 },
  { key: "kids_ab2",     name: "Kids Ab2",     teacherKey: "abdusattor", level: "ELEMENTARY",       schedule: "Mon, Wed, Fri 08:00", monthlyFee: 300000, maxStudents: 12 },
  { key: "kids_ab3",     name: "Kids Ab3",     teacherKey: "abdusattor", level: "ELEMENTARY",       schedule: "Tue, Thu, Sat 10:00", monthlyFee: 250000, maxStudents: 15 },
  { key: "kids_ab4",     name: "Kids Ab4",     teacherKey: "abdusattor", level: "ELEMENTARY",       schedule: "Mon, Wed, Fri 10:00", monthlyFee: 250000, maxStudents: 20 },
  { key: "doniyor",      name: "Doniyor",      teacherKey: "doniyor",    level: "INTERMEDIATE",    schedule: "Tue, Thu, Sat",       monthlyFee: 300000, maxStudents: 25 },
  { key: "bekzod",       name: "Bekzod",       teacherKey: "bekzod",     level: "PRE_INTERMEDIATE", schedule: "Mon, Wed, Fri",       monthlyFee: 300000, maxStudents: 25 },
  { key: "rus_tili",     name: "Rus tili N",   teacherKey: "shahnoza",   level: "BEGINNER",         schedule: "Mon, Wed, Fri 14:30", monthlyFee: 300000, maxStudents: 20 },
  { key: "oisha",        name: "Oisha",        teacherKey: "oisha",      level: "BEGINNER",         schedule: "Mon, Wed, Fri 14:00", monthlyFee: 250000, maxStudents: 15 },
  { key: "elbek",        name: "Elbek",        teacherKey: "elbek",      level: "PRE_INTERMEDIATE", schedule: "Mon, Wed, Fri 14:00", monthlyFee: 300000, maxStudents: 15 },
  { key: "navruz",       name: "Navruz",       teacherKey: "navruz",     level: "BEGINNER",         schedule: "Tue, Thu, Sat",       monthlyFee: 250000, maxStudents: 12 },
  { key: "dilafruz",     name: "Dilafruz",     teacherKey: "dilafruz",   level: "BEGINNER",         schedule: "Tue, Thu, Sat 17:00", monthlyFee: 250000, maxStudents: 12 },
];

// firstName, lastName ("" for single-name), email, phone, groupKey
const STUDENTS: { fn: string; ln: string; email: string; phone: string; group: string }[] = [
  // ── Inter Ab2 (Abdusattor, MWF 14:30, 350k) ──────────────────────────────
  { fn: "Isfandiyor",  ln: "Rahmanov",        email: "isfandiyor.rahmanov@discover.uz",      phone: "93 901 51 41", group: "inter_ab2" },
  { fn: "Abrorbek",   ln: "Sultonbekov",      email: "abrorbek.sultonbekov@discover.uz",     phone: "93 097 09 08", group: "inter_ab2" },
  { fn: "Azizbek",    ln: "Sobitxanov",       email: "azizbek.sobitxanov@discover.uz",       phone: "93 945 72 19", group: "inter_ab2" },
  { fn: "Barkamol",   ln: "Solijanov",        email: "barkamol.solijanov@discover.uz",       phone: "",             group: "inter_ab2" },
  { fn: "Shaxriyor",  ln: "",                 email: "shaxriyor@discover.uz",                phone: "",             group: "inter_ab2" },
  { fn: "Mustafo",    ln: "",                 email: "mustafo@discover.uz",                  phone: "",             group: "inter_ab2" },

  // ── Pre Ab2 (Abdusattor, TTh Sa, 300k) ───────────────────────────────────
  { fn: "Umida",           ln: "Mamadjanova",        email: "umida.mamadjanova@discover.uz",       phone: "50 774 27 71", group: "pre_ab2" },
  { fn: "Fayozbek",        ln: "Xusniddinov",        email: "fayozbek.xusniddinov@discover.uz",    phone: "97 520 19 64", group: "pre_ab2" },
  { fn: "Shahlo",          ln: "Abdurahmanova",      email: "shahlo.abdurahmanova@discover.uz",    phone: "93 945 65 36", group: "pre_ab2" },
  { fn: "Muhammadamin",    ln: "Xasanboyev",         email: "muhammadamin.xasanboyev@discover.uz", phone: "97 270 42 49", group: "pre_ab2" },
  { fn: "Shukrona",        ln: "Komiljanova",        email: "shukrona.komiljanova@discover.uz",    phone: "",             group: "pre_ab2" },
  { fn: "Zilola",          ln: "Muhammadvaliyeva",   email: "zilola.muhammadvaliyeva@discover.uz", phone: "99 390 49 50", group: "pre_ab2" },
  { fn: "Nodirbek",        ln: "Mutalliyev",         email: "nodirbek.mutalliyev@discover.uz",     phone: "",             group: "pre_ab2" },
  { fn: "Shahzod",         ln: "Azamov",             email: "shahzod.azamov@discover.uz",          phone: "93 708 05 05", group: "pre_ab2" },

  // ── Beginner Ab2 (Abdusattor, TTh Sa 17:00, 250k) ────────────────────────
  { fn: "Hayotbek",   ln: "Xusniddinov",    email: "hayotbek.xusniddinov@discover.uz",    phone: "97 520 19 64", group: "beginner_ab2" },
  { fn: "Azamjon",    ln: "",               email: "azamjon@discover.uz",                 phone: "",             group: "beginner_ab2" },
  { fn: "Dildora",    ln: "Arabxujayeva",   email: "dildora.arabxujayeva@discover.uz",    phone: "88 256 65 65", group: "beginner_ab2" },

  // ── Kids Ab1 (Abdusattor, TTh Sa 14:30, 250k) ────────────────────────────
  { fn: "Islombek",       ln: "",              email: "islombek@discover.uz",              phone: "88 620 05 01", group: "kids_ab1" },
  { fn: "Komila",         ln: "Abdumalikova", email: "komila.abdumalikova@discover.uz",   phone: "94 123 56 74", group: "kids_ab1" },
  { fn: "Mavluda",        ln: "Ilhomjanova",  email: "mavluda.ilhomjanova@discover.uz",   phone: "91 342 93 93", group: "kids_ab1" },
  { fn: "Bunyodbek",      ln: "Gofurjanov",   email: "bunyodbek.gofurjanov@discover.uz",  phone: "93 042 77 75", group: "kids_ab1" },
  { fn: "Muhammadamin",   ln: "Shokirov",     email: "muhammadamin.shokirov@discover.uz", phone: "97 270 11 10", group: "kids_ab1" },
  { fn: "Sardorbek",      ln: "Akramov",      email: "sardorbek.akramov@discover.uz",     phone: "99 247 77 44", group: "kids_ab1" },
  { fn: "Afzalbek",       ln: "Nematullayev", email: "afzalbek.nematullayev@discover.uz", phone: "93 263 87 91", group: "kids_ab1" },
  { fn: "Muhammadyusuf",  ln: "Alimjanov",    email: "muhammadyusuf.alimjanov@discover.uz", phone: "", group: "kids_ab1" },
  { fn: "Dovudxon",       ln: "Abdulboqiyev", email: "dovudxon.abdulboqiyev@discover.uz", phone: "94 715 12 06", group: "kids_ab1" },
  { fn: "Muslima",        ln: "Vahabjanova",  email: "muslima.vahabjanova@discover.uz",   phone: "",             group: "kids_ab1" },

  // ── Kids Ab2 (Abdusattor, MWF 08:00, 300k) ───────────────────────────────
  { fn: "Ahadjon",    ln: "Odiljanov",           email: "ahadjon.odiljanov@discover.uz",         phone: "93 494 56 64", group: "kids_ab2" },
  { fn: "Qosimjon",   ln: "Qodirjanov",          email: "qosimjon.qodirjanov@discover.uz",        phone: "94 150 43 66", group: "kids_ab2" },
  { fn: "Dilafruz",   ln: "Gulamjanova",         email: "dilafruz.gulamjanova@discover.uz",       phone: "99 022 85 12", group: "kids_ab2" },
  { fn: "Muazzam",    ln: "Avazjanova",          email: "muazzam.avazjanova@discover.uz",         phone: "93 947 66 56", group: "kids_ab2" },
  { fn: "Shahrizoda", ln: "Abdullajonova",       email: "shahrizoda.abdullajonova@discover.uz",   phone: "94 307 89 09", group: "kids_ab2" },

  // ── Kids Ab3 (Abdusattor, TTh Sa 10:00, 250k) ────────────────────────────
  { fn: "Muxtasar",   ln: "",              email: "muxtasar@discover.uz",              phone: "",             group: "kids_ab3" },
  { fn: "Iroda",      ln: "Ikromjanova",   email: "iroda.ikromjanova@discover.uz",     phone: "33 373 00 59", group: "kids_ab3" },
  { fn: "Islomjon",   ln: "",              email: "islomjon@discover.uz",              phone: "",             group: "kids_ab3" },
  { fn: "Mustafo",    ln: "",              email: "mustafo2@discover.uz",              phone: "93 911 91 90", group: "kids_ab3" },
  { fn: "Madina",     ln: "Rahimova",      email: "madina.rahimova@discover.uz",       phone: "99 481 85 51", group: "kids_ab3" },
  { fn: "Farzona",    ln: "Alijanova",     email: "farzona.alijanova@discover.uz",     phone: "99 268 88 89", group: "kids_ab3" },
  { fn: "Mehriddin",  ln: "Ibrahimov",     email: "mehriddin.ibrahimov@discover.uz",   phone: "93 145 82 15", group: "kids_ab3" },
  { fn: "Xushnudbek", ln: "Abdumannopov", email: "xushnudbek.abdumannopov@discover.uz", phone: "99 531 91 72", group: "kids_ab3" },
  { fn: "Akbar",      ln: "Mamataliyev",   email: "akbar.mamataliyev@discover.uz",     phone: "94 873 12 20", group: "kids_ab3" },
  { fn: "Jamshid",    ln: "Abduvohitov",   email: "jamshid.abduvohitov@discover.uz",   phone: "91 280 14 04", group: "kids_ab3" },
  { fn: "Sanjarbek",  ln: "Turdialiyev",   email: "sanjarbek.turdialiyev@discover.uz", phone: "90 797 01 95", group: "kids_ab3" },
  { fn: "Iroda",      ln: "Rustamova",     email: "iroda.rustamova@discover.uz",       phone: "93 194 19 00", group: "kids_ab3" },
  { fn: "Madina",     ln: "Abdukarimova",  email: "madina.abdukarimova@discover.uz",   phone: "",             group: "kids_ab3" },

  // ── Kids Ab4 (Abdusattor, MWF 10:00, 250k) ───────────────────────────────
  { fn: "Ezoza",       ln: "Ikramjanova",       email: "ezoza.ikramjanova@discover.uz",       phone: "94 865 88 03", group: "kids_ab4" },
  { fn: "Umarjon",     ln: "Abdullayev",        email: "umarjon.abdullayev@discover.uz",       phone: "99 419 00 40", group: "kids_ab4" },
  { fn: "Hikmatoy",    ln: "Orifjanova",        email: "hikmatoy.orifjanova@discover.uz",      phone: "97 620 63 13", group: "kids_ab4" },
  { fn: "Nigora",      ln: "Abduvalikova",      email: "nigora.abduvalikova@discover.uz",      phone: "95 048 07 93", group: "kids_ab4" },
  { fn: "Bexruz",      ln: "Mamatov",           email: "bexruz.mamatov@discover.uz",           phone: "93 943 40 00", group: "kids_ab4" },
  { fn: "Bexruz",      ln: "Abdullayev",        email: "bexruz.abdullayev@discover.uz",        phone: "50 090 66 11", group: "kids_ab4" },
  { fn: "Omadbek",     ln: "Abdullayev",        email: "omadbek.abdullayev@discover.uz",       phone: "",             group: "kids_ab4" },
  { fn: "Ibrohim",     ln: "Mirzaaxmedov",      email: "ibrohim.mirzaaxmedov@discover.uz",     phone: "90 794 10 00", group: "kids_ab4" },
  { fn: "Axrorbek",    ln: "Abdullayev",        email: "axrorbek.abdullayev@discover.uz",       phone: "94 652 09 06", group: "kids_ab4" },
  { fn: "Madina",      ln: "Atavaliya",         email: "madina.atavaliya@discover.uz",          phone: "99 393 79 86", group: "kids_ab4" },
  { fn: "Zuxraxon",    ln: "Odiljanova",        email: "zuxraxon.odiljanova@discover.uz",       phone: "93 268 82 12", group: "kids_ab4" },
  { fn: "Abubakr",     ln: "Ahmadjanov",        email: "abubakr.ahmadjanov@discover.uz",        phone: "93 962 99 66", group: "kids_ab4" },
  { fn: "Noila",       ln: "",                  email: "noila@discover.uz",                     phone: "",             group: "kids_ab4" },
  { fn: "Abdulahat",   ln: "Gofurjanov",        email: "abdulahat.gofurjanov@discover.uz",      phone: "93 130 46 44", group: "kids_ab4" },
  { fn: "Mohlaroy",    ln: "Hamidullayeva",      email: "mohlaroy.hamidullayeva@discover.uz",    phone: "",             group: "kids_ab4" },
  { fn: "Nargiza",     ln: "",                  email: "nargiza@discover.uz",                   phone: "",             group: "kids_ab4" },
  { fn: "Azizbek",     ln: "Sobirjanov",        email: "azizbek.sobirjanov@discover.uz",        phone: "95 141 60 09", group: "kids_ab4" },

  // ── Oisha (Oisha, MWF 14:00, 250k) ───────────────────────────────────────
  { fn: "Azizbek",      ln: "Xasanbayev",       email: "azizbek.xasanbayev@discover.uz",       phone: "",             group: "oisha" },
  { fn: "Gulzoda",      ln: "Rashidova",        email: "gulzoda.rashidova@discover.uz",         phone: "90 214 76 56", group: "oisha" },
  { fn: "Muhammadali",  ln: "Maxmudjanov",      email: "muhammadali.maxmudjanov@discover.uz",   phone: "93 405 51 26", group: "oisha" },
  { fn: "Mustafo",      ln: "",                 email: "mustafo3@discover.uz",                  phone: "94 508 11 91", group: "oisha" },
  { fn: "Muhammadaziz", ln: "",                 email: "muhammadaziz@discover.uz",              phone: "",             group: "oisha" },
  { fn: "Mansurbek",    ln: "",                 email: "mansurbek@discover.uz",                 phone: "91 294 36 60", group: "oisha" },
  { fn: "Farrux",       ln: "Isomiddinov",      email: "farrux.isomiddinov@discover.uz",        phone: "94 897 51 59", group: "oisha" },
  { fn: "Farangiz",     ln: "Usmanjanova",      email: "farangiz.usmanjanova@discover.uz",      phone: "97 623 13 83", group: "oisha" },
  { fn: "Oydina",       ln: "Otaxanova",        email: "oydina.otaxanova@discover.uz",          phone: "94 174 00 27", group: "oisha" },
  { fn: "Ozoda",        ln: "Obidjanova",       email: "ozoda.obidjanova@discover.uz",          phone: "94 502 27 12", group: "oisha" },
  { fn: "Azamat",       ln: "Isomiddinov",      email: "azamat.isomiddinov@discover.uz",        phone: "",             group: "oisha" },
  { fn: "Mufara",       ln: "",                 email: "mufara@discover.uz",                    phone: "",             group: "oisha" },

  // ── Navruz (Navruz, TTh Sa, 250k) ────────────────────────────────────────
  { fn: "Ziyodbek",    ln: "Abdulboqiyev",   email: "ziyodbek.abdulboqiyev@discover.uz",   phone: "99 975 72 84", group: "navruz" },
  { fn: "Ismoil",      ln: "",               email: "ismoil@discover.uz",                  phone: "",             group: "navruz" },
  { fn: "Islombek",    ln: "",               email: "islombek2@discover.uz",               phone: "94 486 24 54", group: "navruz" },
  { fn: "Shoxrux",     ln: "Alimjanov",      email: "shoxrux.alimjanov@discover.uz",       phone: "94 921 23 26", group: "navruz" },
  { fn: "Boburjon",    ln: "Izzatullayev",   email: "boburjon.izzatullayev@discover.uz",   phone: "88 837 76 67", group: "navruz" },
  { fn: "Abdulbosit",  ln: "Xamidullayev",   email: "abdulbosit.xamidullayev@discover.uz", phone: "",             group: "navruz" },
  { fn: "Asadbek",     ln: "Ahmadjanov",     email: "asadbek.ahmadjanov@discover.uz",      phone: "93 962 99 66", group: "navruz" },
  { fn: "Ahrorbek",    ln: "",               email: "ahrorbek@discover.uz",                phone: "",             group: "navruz" },

  // ── Rus tili N (Shahnoza, MWF 14:30, 300k) ───────────────────────────────
  { fn: "Muslima",     ln: "",                email: "muslima@discover.uz",                phone: "93 943 07 57", group: "rus_tili" },
  { fn: "Kumushoy",    ln: "Otaxanova",       email: "kumushoy.otaxanova@discover.uz",     phone: "",             group: "rus_tili" },
  { fn: "Azizbek",     ln: "Dedaxanov",       email: "azizbek.dedaxanov@discover.uz",      phone: "",             group: "rus_tili" },
  { fn: "Iqboljon",    ln: "Baxramjonov",     email: "iqboljon.baxramjonov@discover.uz",   phone: "97 123 07 03", group: "rus_tili" },
  { fn: "Nurbek",      ln: "",                email: "nurbek@discover.uz",                 phone: "77 370 79 71", group: "rus_tili" },
  { fn: "Shirina",     ln: "",                email: "shirina@discover.uz",                phone: "77 370 79 71", group: "rus_tili" },
  { fn: "Mohinur",     ln: "Sirojiddinova",   email: "mohinur.sirojiddinova@discover.uz",  phone: "93 946 18 68", group: "rus_tili" },
  { fn: "Nodira",      ln: "Sirojiddinova",   email: "nodira.sirojiddinova@discover.uz",   phone: "",             group: "rus_tili" },
  { fn: "Rayxona",     ln: "Urayimova",       email: "rayxona.urayimova@discover.uz",      phone: "94 079 83 83", group: "rus_tili" },
  { fn: "Barchinoy",   ln: "Xolmirzayeva",    email: "barchinoy.xolmirzayeva@discover.uz", phone: "70 233 04 59", group: "rus_tili" },
  { fn: "Muhammadali", ln: "",                email: "muhammadali@discover.uz",             phone: "",             group: "rus_tili" },
  { fn: "Hadicha",     ln: "",                email: "hadicha@discover.uz",                phone: "94 633 33 86", group: "rus_tili" },
  { fn: "Xilola",      ln: "Xusanboyeva",     email: "xilola.xusanboyeva@discover.uz",     phone: "50 767 71 09", group: "rus_tili" },
  { fn: "Azizbek",     ln: "Mahamadjanov",    email: "azizbek.mahamadjanov@discover.uz",   phone: "77 715 14 05", group: "rus_tili" },
  { fn: "Begoyim",     ln: "",                email: "begoyim@discover.uz",                phone: "",             group: "rus_tili" },

  // ── Bekzod (Bekzod, MWF, 300k) ───────────────────────────────────────────
  { fn: "Rayxona",      ln: "Xamidjanova",       email: "rayxona.xamidjanova@discover.uz",     phone: "33 552 83 87", group: "bekzod" },
  { fn: "Xumoyun",      ln: "",                  email: "xumoyun@discover.uz",                 phone: "",             group: "bekzod" },
  { fn: "Mushtariy",    ln: "",                  email: "mushtariy@discover.uz",               phone: "",             group: "bekzod" },
  { fn: "Dilnoza",      ln: "",                  email: "dilnoza@discover.uz",                 phone: "",             group: "bekzod" },
  { fn: "Robiya",       ln: "",                  email: "robiya@discover.uz",                  phone: "",             group: "bekzod" },
  { fn: "Bekzod",       ln: "Izzatullayev",      email: "bekzod.izzatullayev@discover.uz",     phone: "",             group: "bekzod" },
  { fn: "Abubakr",      ln: "Usmanov",           email: "abubakr.usmanov@discover.uz",         phone: "93 925 17 67", group: "bekzod" },
  { fn: "Azamt",        ln: "Dadamirzayev",      email: "azamt.dadamirzayev@discover.uz",      phone: "93 499 18 71", group: "bekzod" },
  { fn: "Xondamir",     ln: "Karimjanov",        email: "xondamir.karimjanov@discover.uz",     phone: "98 433 62 29", group: "bekzod" },
  { fn: "Gulsanam",     ln: "Xoshimjanova",      email: "gulsanam.xoshimjanova@discover.uz",   phone: "93 584 84 89", group: "bekzod" },
  { fn: "Kumush",       ln: "Asqaraliyeva",      email: "kumush.asqaraliyeva@discover.uz",     phone: "",             group: "bekzod" },
  { fn: "Charos",       ln: "",                  email: "charos@discover.uz",                  phone: "",             group: "bekzod" },
  { fn: "Azizbek",      ln: "",                  email: "azizbek@discover.uz",                 phone: "",             group: "bekzod" },
  { fn: "Azamat",       ln: "",                  email: "azamat@discover.uz",                  phone: "",             group: "bekzod" },
  { fn: "Muhammadali",  ln: "",                  email: "muhammadali2@discover.uz",             phone: "",             group: "bekzod" },
  { fn: "Gulzoda",      ln: "",                  email: "gulzoda@discover.uz",                 phone: "",             group: "bekzod" },
  { fn: "Muhammadyunus",ln: "",                  email: "muhammadyunus@discover.uz",            phone: "93 144 32 84", group: "bekzod" },
  { fn: "Mubina",       ln: "Bekmirzayeva",      email: "mubina.bekmirzayeva@discover.uz",     phone: "94 153 52 54", group: "bekzod" },
  { fn: "Dilnoza",      ln: "Xolmirzayeva",      email: "dilnoza.xolmirzayeva@discover.uz",    phone: "93 580 95 85", group: "bekzod" },
  { fn: "Muhammadzohid",ln: "Hakimjanov",        email: "muhammadzohid.hakimjanov@discover.uz",phone: "",             group: "bekzod" },
  { fn: "Alisher",      ln: "Djalilov",          email: "alisher.djalilov@discover.uz",        phone: "",             group: "bekzod" },
  { fn: "Temurbek",     ln: "",                  email: "temurbek@discover.uz",                phone: "",             group: "bekzod" },
  { fn: "Faxriddin",    ln: "Ochildiyev",        email: "faxriddin.ochildiyev@discover.uz",    phone: "",             group: "bekzod" },

  // ── Doniyor (Doniyor, TTh Sa, 300k) ──────────────────────────────────────
  { fn: "Mubina",        ln: "Numanjanova",       email: "mubina.numanjanova@discover.uz",     phone: "94 907 38 87", group: "doniyor" },
  { fn: "Mushtariy",     ln: "Tojiddinova",       email: "mushtariy.tojiddinova@discover.uz",  phone: "33 722 11 10", group: "doniyor" },
  { fn: "Marjona",       ln: "Ismoiljanova",      email: "marjona.ismoiljanova@discover.uz",   phone: "95 161 62 61", group: "doniyor" },
  { fn: "Shahlo",        ln: "Otamirzayeva",      email: "shahlo.otamirzayeva@discover.uz",    phone: "93 678 48 35", group: "doniyor" },
  { fn: "Mufazzil",      ln: "Botirjanov",        email: "mufazzil.botirjanov@discover.uz",    phone: "95 771 86 86", group: "doniyor" },
  { fn: "Faxriddin",     ln: "Boqijanov",         email: "faxriddin.boqijanov@discover.uz",    phone: "93 734 05 03", group: "doniyor" },
  { fn: "Rayxona",       ln: "",                  email: "rayxona@discover.uz",                phone: "",             group: "doniyor" },
  { fn: "Umida",         ln: "",                  email: "umida@discover.uz",                  phone: "",             group: "doniyor" },
  { fn: "Shahlo",        ln: "",                  email: "shahlo@discover.uz",                 phone: "",             group: "doniyor" },
  { fn: "Marxabo",       ln: "",                  email: "marxabo@discover.uz",                phone: "",             group: "doniyor" },
  { fn: "Bilolxon",      ln: "",                  email: "bilolxon@discover.uz",               phone: "",             group: "doniyor" },
  { fn: "Muhammadali",   ln: "",                  email: "muhammadali3@discover.uz",            phone: "",             group: "doniyor" },
  { fn: "Islombek",      ln: "",                  email: "islombek3@discover.uz",               phone: "",             group: "doniyor" },
  { fn: "Dilshoda",      ln: "",                  email: "dilshoda@discover.uz",               phone: "",             group: "doniyor" },
  { fn: "Dostonbek",     ln: "",                  email: "dostonbek@discover.uz",              phone: "",             group: "doniyor" },
  { fn: "Shaxboz",       ln: "",                  email: "shaxboz@discover.uz",                phone: "",             group: "doniyor" },
  { fn: "Muhammadyusuf", ln: "Abdusattarov",      email: "muhammadyusuf.abdusattarov@discover.uz", phone: "", group: "doniyor" },
  { fn: "Azima",         ln: "",                  email: "azima@discover.uz",                  phone: "",             group: "doniyor" },
  { fn: "Nafisa",        ln: "",                  email: "nafisa@discover.uz",                 phone: "",             group: "doniyor" },
  { fn: "Dilshod",       ln: "",                  email: "dilshod@discover.uz",                phone: "",             group: "doniyor" },
  { fn: "Saida",         ln: "Ikramjanova",       email: "saida.ikramjanova@discover.uz",      phone: "",             group: "doniyor" },

  // ── Dilafruz (Dilafruz, TTh Sa 17:00, 250k) ──────────────────────────────
  { fn: "Umarbek",      ln: "",                 email: "umarbek@discover.uz",               phone: "99 419 00 40", group: "dilafruz" },
  { fn: "Hikmatoy",     ln: "",                 email: "hikmatoy@discover.uz",              phone: "97 620 63 13", group: "dilafruz" },
  { fn: "Abubakr",      ln: "",                 email: "abubakr@discover.uz",               phone: "99 226 62 92", group: "dilafruz" },
  { fn: "Abubakr",      ln: "Ahmadjanov",       email: "abubakr.ahmadjanov2@discover.uz",   phone: "",             group: "dilafruz" },
  { fn: "Mohlaroyim",   ln: "Xamidullayeva",    email: "mohlaroyim.xamidullayeva@discover.uz", phone: "",          group: "dilafruz" },

  // ── Elbek (Elbek, MWF 14:00, 300k) ──────────────────────────────────────
  { fn: "Abdulhoshim",  ln: "Abduganiyev",   email: "abdulhoshim.abduganiyev@discover.uz",  phone: "",             group: "elbek" },
  { fn: "Dilnoza",      ln: "Nasliddinova",  email: "dilnoza.nasliddinova@discover.uz",      phone: "",             group: "elbek" },
  { fn: "Dildora",      ln: "Nasliddinova",  email: "dildora.nasliddinova@discover.uz",      phone: "",             group: "elbek" },
  { fn: "Odina",        ln: "Vahabova",      email: "odina.vahabova@discover.uz",            phone: "",             group: "elbek" },
  { fn: "Diyora",       ln: "Abdulhamidova", email: "diyora.abdulhamidova@discover.uz",      phone: "",             group: "elbek" },
  { fn: "Munisa",       ln: "",              email: "munisa@discover.uz",                    phone: "",             group: "elbek" },
  { fn: "Abduhalil",    ln: "",              email: "abduhalil@discover.uz",                 phone: "88 471 55 15", group: "elbek" },
  { fn: "Marufjon",     ln: "",              email: "marufjon@discover.uz",                  phone: "93 997 55 35", group: "elbek" },
  { fn: "Shirina",      ln: "",              email: "shirina2@discover.uz",                  phone: "93 678 91 01", group: "elbek" },
  { fn: "Afzalbek",     ln: "",              email: "afzalbek@discover.uz",                  phone: "",             group: "elbek" },
  { fn: "Guljona",      ln: "",              email: "guljona@discover.uz",                   phone: "93 409 22 32", group: "elbek" },
  { fn: "Sarvinoz",     ln: "",              email: "sarvinoz@discover.uz",                  phone: "93 826 83 85", group: "elbek" },
];

const LEADS = [
  { fn: "Mirzohid",      ln: "Abdulazizov",     phone: "93 434 01 07", status: "TRIAL",  notes: "Rus tili, 9-sinf. Tel qilindi, 1-dars o'tdi." },
  { fn: "Mubina",        ln: "Bekmirzayeva",     phone: "94 153 52 54", status: "ACTIVE", notes: "Ingliz tili. Guruhga qo'shildi (Bekzod)." },
  { fn: "Dilnoza",       ln: "Xolmirzayeva",     phone: "93 580 95 85", status: "ACTIVE", notes: "Guruhga qo'shildi (Bekzod)." },
  { fn: "Zuxraxon",      ln: "Odiljanova",       phone: "93 268 82 12", status: "LEAD",   notes: "Ingliz tili, 6-sinf. Abdusattor." },
  { fn: "Jobirbek",      ln: "Ravshanjanov",     phone: "93 401 62 94", status: "LEAD",   notes: "Ingliz tili, 4-sinf. Abdusattor." },
  { fn: "Sardorbek",     ln: "Mahammadjanov",    phone: "97 858 18 08", status: "ACTIVE", notes: "Ingliz tili, kollej. Guruhga qo'shildi (Bekzod)." },
  { fn: "Sardorbek",     ln: "Nematullayev",     phone: "50 506 55 26", status: "ACTIVE", notes: "Ingliz tili, kollej. Guruhga qo'shildi (Bekzod)." },
  { fn: "Ibrohim",       ln: "Olimjanov",        phone: "99 706 60 00", status: "TRIAL",  notes: "Ingliz tili, 9-sinf. Bekzod. Sinov dars o'tdi." },
  { fn: "Nilufar",       ln: "Turaboyeva",       phone: "88 212 37 89", status: "TRIAL",  notes: "Ingliz tili, 10-sinf. Bekzod. Sinov dars o'tdi." },
  { fn: "Islombek",      ln: "Rahmatullayev",    phone: "93 495 25 94", status: "TRIAL",  notes: "Matematika, 3-sinf. Sinov dars o'tdi." },
  { fn: "Zilola",        ln: "Juraxanova",       phone: "88 573 70 02", status: "LEAD",   notes: "Ingliz tili." },
  { fn: "Marxabo",       ln: "Abdurashidova",    phone: "97 255 24 22", status: "LEAD",   notes: "Rus tili, 9-sinf. Shahnoza." },
  { fn: "Azamat",        ln: "Nosirjanov",       phone: "99 006 01 12", status: "LEAD",   notes: "Matematika, 6-sinf." },
  { fn: "Madina",        ln: "Abdukarimova",     phone: "99 449 13 79", status: "LEAD",   notes: "Ingliz tili, 5-sinf. Abdusattor." },
  { fn: "Afzal",         ln: "Karimjanov",       phone: "88 555 40 90", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Bekzod." },
  { fn: "Abduxalil",     ln: "Tuxtasinov",       phone: "88 471 55 15", status: "LEAD",   notes: "Ingliz tili, 10-sinf. Elbek." },
  { fn: "Marufjon",      ln: "Turgunpolatov",    phone: "93 997 55 35", status: "LEAD",   notes: "Ingliz tili, 10-sinf. Elbek." },
  { fn: "Shirina",       ln: "Ismailova",        phone: "93 678 91 01", status: "LEAD",   notes: "Ingliz tili, 10-sinf. Elbek." },
  { fn: "Alibek",        ln: "Madmudjanov",      phone: "94 145 66 77", status: "LEAD",   notes: "Matematika, 6-sinf. Dilafruz." },
  { fn: "Muslima",       ln: "Maxmudjanova",     phone: "000 000 00 00", status: "LEAD",  notes: "Matematika, 3-sinf. Dilafruz." },
  { fn: "Abror",         ln: "Muhammadjanov",    phone: "50 123 00 57", status: "LEAD",   notes: "Rus tili, 11-sinf. Shahnoza." },
  { fn: "Azizbek",       ln: "Abdulvoitov",      phone: "77 211 88 99", status: "LEAD",   notes: "Rus tili. Shahnoza." },
  { fn: "Azizbek",       ln: "Sobirjanov",       phone: "95 141 60 09", status: "LEAD",   notes: "Ingliz tili, 7-sinf. Abdusattor." },
  { fn: "Noila",         ln: "Mahamadaliyeva",   phone: "95 031 33 81", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Doniyor." },
  { fn: "Sarvinoz",      ln: "Abdurahmanova",    phone: "93 826 83 85", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Elbek." },
  { fn: "Guljona",       ln: "Bahramova",        phone: "93 409 22 32", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Elbek." },
  { fn: "Dilnoza",       ln: "",                 phone: "93 945 71 24", status: "LEAD",   notes: "Ingliz tili, 7-sinf. Navruz." },
  { fn: "Mohlaroy",      ln: "Zokirjanova",      phone: "93 262 62 52", status: "LEAD",   notes: "Ingliz tili, 3-sinf. Abdusattor." },
  { fn: "Muhammadkarim", ln: "Karimjanov",       phone: "93 268 09 83", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Elbek." },
  { fn: "Dilshoda",      ln: "Jaloliddinova",    phone: "94 923 82 35", status: "LEAD",   notes: "Ingliz tili, 9-sinf. Elbek." },
  { fn: "Muhammadmustafo",ln: "Rustamjanov",     phone: "77 337 52 77", status: "LEAD",   notes: "Ingliz tili, 7-sinf." },
];

// category: arenda→RENT, avans→SALARIES, konstavar→SUPPLIES, oylik→SALARIES
const EXPENSES = [
  { title: "Doniyor — rang", category: "SUPPLIES",  amount: 40000,    date: "2026-05-05", desc: "konstavar" },
  { title: "Bekzod — avans", category: "SALARIES",  amount: 100000,   date: "2026-05-07", desc: "avans" },
  { title: "Doniyor — daftar ruchka", category: "SUPPLIES", amount: 150000, date: "2026-05-08", desc: "konstavar" },
  { title: "Bekzod — avans", category: "SALARIES",  amount: 1000000,  date: "2026-05-08", desc: "avans" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 1000000,  date: "2026-05-10", desc: "avans" },
  { title: "Abdusattor — avans", category: "SALARIES", amount: 500000, date: "2026-05-13", desc: "avans" },
  { title: "Doniyor — list marker", category: "SUPPLIES", amount: 100000, date: "2026-05-13", desc: "konstavar" },
  { title: "Bekzod — avans", category: "SALARIES",  amount: 600000,   date: "2026-05-14", desc: "avans" },
  { title: "Dilafruz — avans", category: "SALARIES",amount: 100000,   date: "2026-05-14", desc: "avans" },
  { title: "Dilafruz — avans", category: "SALARIES",amount: 400000,   date: "2026-05-15", desc: "avans" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 500000,   date: "2026-05-15", desc: "avans" },
  { title: "Abdusattor — avans", category: "SALARIES", amount: 500000, date: "2026-05-15", desc: "avans" },
  { title: "Elbek — avans", category: "SALARIES",   amount: 300000,   date: "2026-05-15", desc: "avans" },
  { title: "Bekzod — avans", category: "SALARIES",  amount: 100000,   date: "2026-05-15", desc: "avans" },
  { title: "Shahnoza — avans", category: "SALARIES",amount: 100000,   date: "2026-05-15", desc: "avans" },
  { title: "Fotima Opa — avans", category: "SALARIES", amount: 150000, date: "2026-05-16", desc: "avans" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 650000,   date: "2026-05-18", desc: "avans" },
  { title: "Oisha — avans", category: "SALARIES",   amount: 450000,   date: "2026-05-18", desc: "avans" },
  { title: "Doniyor — list", category: "SUPPLIES",  amount: 80000,    date: "2026-05-19", desc: "konstavar" },
  { title: "Elbek — avans", category: "SALARIES",   amount: 600000,   date: "2026-05-20", desc: "avans" },
  { title: "Abdusattor — avans", category: "SALARIES", amount: 200000, date: "2026-05-21", desc: "avans" },
  { title: "Ijara (arenda)", category: "RENT",       amount: 4840000,  date: "2026-05-21", desc: "arenda — Doniyor" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 300000,   date: "2026-05-22", desc: "avans" },
  { title: "Oisha — oylik",  category: "SALARIES",  amount: 770000,   date: "2026-05-22", desc: "oylik" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 100000,   date: "2026-05-23", desc: "avans" },
  { title: "Shahnoza Opa — avans", category: "SALARIES", amount: 200000, date: "2026-05-25", desc: "avans" },
  { title: "Abdusattor — avans", category: "SALARIES", amount: 1800000, date: "2026-05-25", desc: "avans" },
  { title: "Doniyor — avans", category: "SALARIES", amount: 200000,   date: "2026-05-26", desc: "avans" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── 0. Remove sample non-admin accounts ───────────────────────────────────
    await client.query(`
      DELETE FROM users WHERE email IN ('teacher@eta.uz', 'student@eta.uz')
    `);

    // ── 1. Hash the shared password once ─────────────────────────────────────
    const hash = await bcrypt.hash("discover123", 10);

    // ── 2. Insert TEACHERS ────────────────────────────────────────────────────
    const teacherIdMap: Record<string, string> = {};

    for (const t of TEACHERS) {
      const userId = randomUUID();
      const teacherId = randomUUID();
      await client.query(`
        INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", phone, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'TEACHER', $4, $5, NULL, true, NOW(), NOW())
      `, [userId, t.email, hash, t.firstName, t.lastName]);
      await client.query(`
        INSERT INTO teachers (id, "userId", subjects, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [teacherId, userId, t.subjects]);
      teacherIdMap[t.key] = teacherId;
    }

    // ── 3. Insert GROUPS ──────────────────────────────────────────────────────
    const groupIdMap: Record<string, string> = {};

    for (const g of GROUPS) {
      const groupId = randomUUID();
      const teacherDbId = teacherIdMap[g.teacherKey];
      await client.query(`
        INSERT INTO groups (id, name, "teacherId", level, schedule, "maxStudents", "isActive", "startDate", "monthlyFee", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, true, '2025-05-01', $7, NOW(), NOW())
      `, [groupId, g.name, teacherDbId, g.level, g.schedule, g.maxStudents, g.monthlyFee]);
      groupIdMap[g.key] = groupId;
    }

    // ── 4. Insert STUDENTS + group links ──────────────────────────────────────
    let studentCount = 0;

    for (const s of STUDENTS) {
      const userId = randomUUID();
      const studentId = randomUUID();
      const groupDbId = groupIdMap[s.group];
      const level = GROUPS.find(g => g.key === s.group)?.level ?? "BEGINNER";

      await client.query(`
        INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", phone, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'STUDENT', $4, $5, $6, true, NOW(), NOW())
      `, [userId, s.email, hash, s.fn, s.ln, s.phone || null]);

      await client.query(`
        INSERT INTO students (id, "userId", status, "englishLevel", balance, "discountPercent",
          "totalCoins", "currentStreak", "longestStreak", badge, "createdAt", "updatedAt")
        VALUES ($1, $2, 'ACTIVE', $3, 0, 0, 0, 0, 0, 'BRONZE', NOW(), NOW())
      `, [studentId, userId, level]);

      await client.query(`
        INSERT INTO group_students (id, "groupId", "studentId", "joinedAt", "isActive")
        VALUES ($1, $2, $3, '2025-05-01', true)
      `, [randomUUID(), groupDbId, studentId]);

      studentCount++;
    }

    // ── 5. Insert LEADS ───────────────────────────────────────────────────────
    for (const l of LEADS) {
      await client.query(`
        INSERT INTO leads (id, "firstName", "lastName", phone, source, status, notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'OTHER', $5, $6, NOW(), NOW())
      `, [randomUUID(), l.fn, l.ln, l.phone, l.status, l.notes]);
    }

    // ── 6. Insert EXPENSES ────────────────────────────────────────────────────
    for (const e of EXPENSES) {
      await client.query(`
        INSERT INTO expenses (id, title, amount, currency, category, description, date, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'UZS', $4, $5, $6, NOW(), NOW())
      `, [randomUUID(), e.title, e.amount, e.category, e.desc, e.date]);
    }

    // ── 7. Update academy name ────────────────────────────────────────────────
    await client.query(`
      UPDATE academy_settings
      SET name = 'Discover School', "updatedAt" = NOW()
      WHERE id = 'singleton'
    `);

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      summary: {
        teachers:  TEACHERS.length,
        groups:    GROUPS.length,
        students:  studentCount,
        leads:     LEADS.length,
        expenses:  EXPENSES.length,
        academy:   "Discover School",
      },
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
