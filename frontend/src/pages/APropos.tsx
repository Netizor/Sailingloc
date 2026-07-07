import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  Headphones,
  Utensils,
  Plane,
  Map,
  ShieldCheck,
  Lock,
  Anchor,
} from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const APropos: React.FC = () => {
  usePageTitle("Nos services - SailingLoc");

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#071d49]">
      <section
        className="relative min-h-[620px] bg-cover bg-center flex items-center px-8 lg:px-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,18,50,.25), rgba(3,18,50,.65)), url('/services-hero.jpg')",
        }}
      >
        <div className="max-w-xl text-white">
          <span className="inline-block bg-white/20 text-xs tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            Exclusivité maritime
          </span>

          <h1 className="text-5xl lg:text-7xl font-serif font-bold leading-tight">
            L’Art de Vivre
            <br />
            <span className="italic">Sans Compromis</span>
          </h1>

          <p className="mt-6 text-white/90 leading-relaxed">
            Notre conciergerie dédiée transforme chaque croisière en une
            expérience sur-mesure, anticipant vos moindres désirs pour une
            sérénité absolue en mer.
          </p>

          <a
            href="#services"
            className="mt-8 inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase"
          >
            Découvrir nos services <ArrowDown size={16} />
          </a>
        </div>
      </section>

      <section id="services" className="px-8 lg:px-20 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold">
            Une Assistance à 360°
          </h2>
          <p className="mt-4 text-gray-500">
            De la gastronomie à la logistique technique, nous redéfinissons les
            standards du service premium en mer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div
            className="lg:col-span-2 min-h-[340px] rounded-xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white"
            style={{
              backgroundImage:
                "linear-gradient(rgba(3,18,50,.10), rgba(3,18,50,.75)), url('/service-chef.jpg')",
            }}
          >
            <div>
              <Utensils className="mb-4" />
              <h3 className="text-2xl font-serif">Chef Gastronomique à Bord</h3>
              <p className="mt-2 text-sm text-white/85 max-w-md">
                <p>
                  Une table étoilée flottante. Nos chefs privés concoctent des
                  menus personnalisés selon vos préférences et les arrivages
                  locaux.
                </p>
              </p>
            </div>
          </div>

          <div className="min-h-[340px] rounded-xl bg-[#eeeef6] border border-gray-200 p-8 flex flex-col justify-between">
            <Headphones size={34} />
            <div>
              <h3 className="text-2xl font-serif">Assistance 24/7</h3>
              <p className="mt-3 text-sm text-gray-600">
                <p>
                  Un support technique et opérationnel disponible à tout
                  instant. Qu'il s'agisse d'un besoin technique ou d'un conseil
                  météo, nos experts veillent sur vous.
                </p>{" "}
              </p>
            </div>
          </div>

          <div className="min-h-[340px] rounded-xl bg-[#071d49] text-white p-8 flex flex-col justify-between">
            <Plane size={34} />
            <div>
              <h3 className="text-2xl font-serif">Logistique VIP</h3>
              <p className="mt-3 text-sm text-white/80">
                <p>
                  Transferts en hélicoptère, chauffeurs privés à l'embarquement
                  et gestion des bagages pour une transition fluide entre terre
                  et mer.
                </p>
              </p>
            </div>
          </div>

          <div
            className="lg:col-span-2 min-h-[340px] rounded-xl overflow-hidden bg-cover bg-center flex items-end p-8 text-white"
            style={{
              backgroundImage:
                "linear-gradient(rgba(3,18,50,.10), rgba(3,18,50,.70)), url('/service-itinerary.jpg')",
            }}
          >
            <div>
              <Map className="mb-4" />
              <h3 className="text-2xl font-serif">Itinéraires sur Mesure</h3>
              <p className="mt-2 text-sm text-white/85 max-w-md">
                <p>
                  Criques secrètes, réservations dans les clubs de plage les
                  plus prisés et escales culturelles privatisées. Nos
                  planificateurs dessinent votre sillage.
                </p>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 lg:px-20 py-24 bg-[#f3f2fb]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="italic font-serif text-[#071d49]">
              “Le luxe n’est pas une option, c’est notre standard.”
            </p>

            <p className="mt-6 text-gray-600 leading-relaxed">
              Parce que chaque navigation est unique, SailingLoc met à votre
              disposition un concierge dédié dès la confirmation de votre
              réservation. Notre réseau mondial de partenaires nous permet de
              répondre aux demandes les plus exigeantes, de la livraison de vins
              rares au mouillage à l'organisation d'événements privés sur le
              pont.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-center gap-4">
                <span className="bg-blue-100 text-blue-700 p-3 rounded-full">
                  <ShieldCheck size={18} />
                </span>
                <p className="font-bold text-sm">
                  Concierges Certifiés Yachting
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="bg-blue-100 text-blue-700 p-3 rounded-full">
                  <Lock size={18} />
                </span>
                <p className="font-bold text-sm">
                  Discrétion & Confidentialité Totale
                </p>
              </div>
            </div>
          </div>

          <img
            src="/service-concierge.jpg"
            alt="Service conciergerie SailingLoc"
            className="rounded-xl shadow-2xl w-full h-[420px] object-cover"
          />
        </div>
      </section>

      <section className="px-8 py-20">
        <div className="max-w-3xl mx-auto bg-[#071d49] text-white rounded-xl shadow-2xl px-10 py-12 text-center relative overflow-hidden">
          <Anchor size={110} className="absolute right-8 top-6 text-white/10" />

          <h2 className="text-3xl font-serif">
            Prêt pour une expérience d’exception ?
          </h2>

          <p className="mt-4 text-white/75">
            Contactez notre équipe conciergerie pour personnaliser votre
            prochain séjour en mer.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-sm font-bold uppercase"
            >
              Prendre rendez-vous
            </Link>

            <Link
              to="/temoignages"
              className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg text-sm font-bold uppercase"
            >
              Voir les témoignages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default APropos;
