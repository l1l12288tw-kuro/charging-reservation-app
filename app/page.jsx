"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TIME_SLOTS = [
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
  "21:00-22:00",
  "22:00-23:00",
];

const today = dayjs();
const days = Array.from({ length: 7 }, (_, i) => today.add(i, "day"));

export default function Home() {
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    supabase
      .from("reservations")
      .select("*")
      .then(({ data }) => {
        setReservations(data || []);
      });

    const channel = supabase
      .channel("realtime reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        supabase.from("reservations").select("*").then(({ data }) => setReservations(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = async () => {
    const email = prompt("請輸入 Email 進行登入/註冊");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("已發送登入連結至信箱，請查收");
  };

  const handleReserve = async (date, time_slot) => {
    if (!user) return alert("請先登入");
    const exists = reservations.find(
      (r) => r.date === date && r.time_slot === time_slot
    );
    if (exists) return;
    await supabase.from("reservations").insert({
      user_id: user.id,
      date,
      time_slot,
    });
  };

  const handleCancel = async (date, time_slot) => {
    if (!user) return;
    const target = reservations.find(
      (r) => r.date === date && r.time_slot === time_slot && r.user_id === user.id
    );
    if (target) {
      await supabase.from("reservations").delete().eq("id", target.id);
    }
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔌 晚間充電樁預約系統</h1>
      {!user ? (
        <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
          登入 / 註冊
        </button>
      ) : (
        <p className="mb-4">👋 歡迎，{user.email}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
        {days.map((day) => (
          <div key={day.format("YYYY-MM-DD")} className="border p-2">
            <h2 className="font-semibold text-center">
              {day.format("ddd MM/DD")}
            </h2>
            {TIME_SLOTS.map((slot) => {
              const res = reservations.find(
                (r) => r.date === day.format("YYYY-MM-DD") && r.time_slot === slot
              );
              const isMine = res?.user_id === user?.id;
              return (
                <button
                  key={slot}
                  onClick={() =>
                    isMine
                      ? handleCancel(day.format("YYYY-MM-DD"), slot)
                      : handleReserve(day.format("YYYY-MM-DD"), slot)
                  }
                  className={`w-full my-1 p-1 rounded border ${
                    res ? (isMine ? "bg-green-300" : "bg-gray-300") : "bg-white"
                  }`}
                >
                  {slot} {res ? (isMine ? "（我預約）" : "（已預約）") : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
