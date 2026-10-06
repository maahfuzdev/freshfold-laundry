const responses = {
      pickup: "আমাদের প্রতিনিধি আপনার নির্ধারিত ঠিকানায় কাপড় সংগ্রহ করতে যাবে।",
      washing: "আপনার কাপড়গুলো আমরা আধুনিক মেশিনে পরিষ্কার করি।",
      delivery: "পরিষ্কার কাপড় আপনার ঠিকানায় ফেরত পাঠানো হবে।",
      tracking: "অর্ডারের অবস্থান আপনি রিয়েল টাইমে ট্র্যাক করতে পারবেন।",
      price: "আমাদের সেবার মূল্য কাপড়ের ধরণ ও পরিমাণ অনুযায়ী নির্ধারিত হয়।",
      timing: "সাধারণত পরিষেবা সম্পন্ন হতে ২৪ থেকে ৪৮ ঘণ্টা সময় লাগে।",
      urgent: "আপনার যদি জরুরি পরিষেবা লাগে, দয়া করে 'Express Service' বেছে নিন।",
      payment: "আপনি নগদ, বিকাশ, অথবা অনলাইন পেমেন্টের মাধ্যমে মূল্য পরিশোধ করতে পারবেন।",
      stain_removal: "আমরা বিশেষ ধরনের দাগ পরিষ্কারের ব্যবস্থা রাখি। দয়া করে অর্ডারে বিস্তারিত উল্লেখ করুন।",
      ironing: "আমরা প্রতিটি কাপড় ইস্ত্রি করে সোজা ও পরিষ্কার অবস্থায় ফেরত দেই।",
      types: "আমরা জামা, প্যান্ট, শাড়ি, কোর্ট, বাচ্চাদের পোশাকসহ বিভিন্ন ধরনের কাপড় পরিষেবা দেই।",
      subscribe: "আপনি চাইলে সাপ্তাহিক বা মাসিক সাবস্ক্রিপশন নিতে পারেন যা আরও সাশ্রয়ী।",
      location: "আমরা বর্তমানে চট্টগ্রাম শহরের অধিকাংশ এলাকায় পরিষেবা দিয়ে থাকি।",
      complaint: "আপনার কোনো অভিযোগ থাকলে আমাদের কাস্টমার কেয়ার নম্বরে যোগাযোগ করুন বা চ্যাটে লিখুন।",
      lost_item: "কোনো আইটেম হারিয়ে গেলে আমরা দ্রুত তদন্ত করে আপনাকে জানাবো।",
      eco_friendly: "আমরা পরিবেশবান্ধব ডিটারজেন্ট ও পানি সাশ্রয়ী পদ্ধতি ব্যবহার করি।",
      folding: "ইস্ত্রি শেষে কাপড় সুন্দরভাবে ভাঁজ করে প্যাকেট করা হয়।",
      reminder: "আপনার অর্ডার রিমাইন্ডার এসএমএস ও অ্যাপে নোটিফিকেশনের মাধ্যমে জানানো হবে।",
      cancellation: "অর্ডার ক্যান্সেল করতে চাইলে ডেলিভারির ১ ঘণ্টা আগেই জানাতে হবে।",
      offers: "আমাদের নিয়মিত ছাড় ও অফার সম্পর্কে জানতে অ্যাপে Notifications অন রাখুন।",
      detergent_type: "আমরা হাই-কোয়ালিটি এবং স্যাফ ডিটারজেন্ট ব্যবহার করি যাতে কাপড়ের রঙ ও কাপড়ের গঠন ঠিক থাকে।",
      service_hours: "আমাদের পরিষেবা সকাল ৯টা থেকে রাত ৯টা পর্যন্ত চালু থাকে।",
      delivery_charge: "৩ কেজির উপরে অর্ডারে ডেলিভারি চার্জ ফ্রি। এর নিচে ৩০ টাকা চার্জ প্রযোজ্য।",
      reschedule: "আপনি চাইলে আপনার ডেলিভারি বা পিকআপ সময় পরিবর্তন করতে পারেন অ্যাপ থেকে।",
      bag_policy: "আপনার কাপড় প্যাকেট করে দিলে আমাদের প্রতিনিধি নিজস্ব ব্যাগে নিয়ে যাবে।",
      discount_students: "বিশ্ববিদ্যালয় শিক্ষার্থীদের জন্য রয়েছে বিশেষ ছাড়। পরিচয়পত্র দেখাতে হবে।",
      support_time: "আমাদের হেল্পলাইন ২৪/৭ খোলা থাকে যেকোনো জিজ্ঞাসার জন্য।",
      feedback: "আপনার ফিডব্যাক আমাদের জন্য গুরুত্বপূর্ণ। অ্যাপে রেটিং দিয়ে জানাতে পারেন।",
      repeat_order: "পূর্বের অর্ডার আবার রিপিট করতে চাইলে ‘Previous Orders’ থেকে বেছে নিতে পারেন।",
      damage_policy: "কোনো ক্ষতি হলে আমাদের রিফান্ড/পূরণ নীতিমালা অনুযায়ী ব্যবস্থা নেওয়া হয়।",
      bulk_order: "হোটেল, হোস্টেল ও কর্পোরেট অর্ডারের জন্য আলাদা রেট ও কাস্টম প্ল্যান আছে।",
      first_order_offer: "প্রথম অর্ডারে ২০% ছাড়! এখনই ব্যবহার করুন কোড: FIRST20",
      registration: "সেবা গ্রহণের জন্য অ্যাপে আপনার নাম ও মোবাইল নম্বর দিয়ে সহজেই রেজিস্ট্রেশন করতে পারেন।",
      referral: "বন্ধুকে রেফার করলে আপনি এবং আপনার বন্ধু দুজনেই পাবেন ১০% ছাড়!",
      loyalty_program: "নিয়মিত গ্রাহকদের জন্য রয়েছে পয়েন্ট ভিত্তিক রিওয়ার্ড সিস্টেম — বেশি ব্যবহার, বেশি উপহার।",
      delay: "অতিরিক্ত অর্ডার বা আবহাওয়াজনিত কারণে ডেলিভারিতে বিলম্ব হতে পারে। দুঃখিত এবং ধন্যবাদ আপনার ধৈর্যের জন্য।",
      packaging: "আমরা প্রতিটি কাপড় আলাদা আলাদা হালকা প্যাকেটে ভরে সরবরাহ করি যাতে পরিষ্কার ও গন্ধযুক্ত থাকে।",
      contact: "যোগাযোগ: ০১৭xxxxxxxx অথবা info@smartlaundry.com.bd",
      language_change: "আপনি অ্যাপে ভাষা পরিবর্তন করে বাংলা/English নির্বাচন করতে পারেন।",
      app_help: "অ্যাপ ব্যবহারে কোনো সমস্যা হলে ‘Help’ সেকশন বা লাইভ চ্যাট ব্যবহার করুন।",
      app_update: "সর্বোচ্চ সেবা পেতে দয়া করে অ্যাপটি সর্বশেষ সংস্করণে আপডেট রাখুন।",
      notifications: "আপনার অর্ডার, ছাড় এবং আপডেট পেতে Notifications অন করে রাখুন।",
      holiday: "বিশেষ ছুটি বা সরকারী ছুটির দিনে আমাদের পরিষেবা সীমিত থাকতে পারে।",
      driver_id: "প্রতিনিধির নিরাপত্তার জন্য সে আপনার কাছে পরিচয়পত্র দেখাবে ও কোড ব্যবহার করবে।",
      accept_items: "আমরা জুতা, পর্দা, বিছানার চাদরসহ আরও অনেক কিছু পরিষ্কার করি — বিস্তারিত দেখতে অ্যাপে যান।",
      do_not_accept: "আমরা ভেজা কাপড়, পচা কাপড় অথবা তীব্র গন্ধযুক্ত কাপড় গ্রহণ করি না।",
      fire_safety: "আমাদের লন্ড্রি সেটআপে রয়েছে ফায়ার সেফটি এবং পরিবেশবান্ধব স্ট্যান্ডার্ড।",
      monthly_plan: "মাসিক সাবস্ক্রিপশন নিলে প্রতিবারের তুলনায় ২৫% পর্যন্ত ছাড় পাওয়া যায়।",
      delivery_partner: "আমাদের ডেলিভারি পার্টনাররা প্রশিক্ষিত এবং সময়নিষ্ঠ।",
      invoice: "প্রতিটি অর্ডারের শেষে আপনি অ্যাপে ডিজিটাল ইনভয়েস পাবেন।",
      late_fee: "যদি আপনি নির্ধারিত সময়ের পরে অর্ডার গ্রহণ করেন, ১৫ টাকা অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।",
      dry_cleaning: "আমরা ড্রাই ক্লিনিং পরিষেবাও দিয়ে থাকি — দামী বা স্পেশাল কাপড়ের জন্য উপযুক্ত।"
    };

    const synonyms = {
      dry: "dry_cleaning",
      dryclean: "dry_cleaning",
      clean: "washing",
      wash: "washing",
      collect: "pickup",
      pickup: "pickup",
      iron: "ironing",
      press: "ironing",
      payment: "payment",
      cost: "price",
      price: "price",
      delivery: "delivery",
      track: "tracking",
      status: "tracking",
      location: "location",
      bag: "bag_policy",
      offer: "offers",
      student: "discount_students",
      late: "late_fee",
      damage: "damage_policy",
      lost: "lost_item",

      // বাংলা শব্দ
      "ধোওয়া": "washing",
      "ইস্ত্রি": "ironing",
      "কালেক্ট": "pickup",
      "দাম": "price",
      "ট্র্যাক": "tracking",
      "হারিয়ে": "lost_item",
      "অফার": "offers",
      "পেমেন্ট": "payment",
      "স্থান": "location"
    };

    function levenshteinDistance(a, b) {
      const matrix = Array.from({ length: a.length + 1 }, () => []);
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // Deletion
            matrix[i][j - 1] + 1,     // Insertion
            matrix[i - 1][j - 1] + cost // Substitution
          );
        }
      }

      return matrix[a.length][b.length];
    }

    function isSimilar(word, target, threshold = 0.5) {
      const distance = levenshteinDistance(word, target);
      const maxLen = Math.max(word.length, target.length);
      return (distance / maxLen) <= (1 - threshold);
    }

    export function getSmartResponse(query) {
      query = query.toLowerCase();
      const words = query.split(/[\s,.;!?]+/);

      // Step 1: Try matching with synonyms (exact)
      for (let word of words) {
        if (synonyms[word]) {
          const key = synonyms[word];
          return responses[key];
        }
      }

      // Step 2: Try matching with responses directly (exact)
      for (let word of words) {
        if (responses[word]) {
          return responses[word];
        }
      }

      // Step 3: Fuzzy matching with synonyms
      for (let word of words) {
        for (let key in synonyms) {
          if (isSimilar(word, key)) {
            const responseKey = synonyms[key];
            return responses[responseKey];
          }
        }
      }

      // Step 4: Fuzzy matching with response keywords
      for (let word of words) {
        for (let key in responses) {
          if (isSimilar(word, key)) {
            return responses[key];
          }
        }
      }

      // Step 5: No match found
      return "দুঃখিত, এই সম্পর্কে আমার কাছে কোনো তথ্য নেই।";
    }
