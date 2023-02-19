---
title: Contact
date: 2021-12-18T03:10:36.000Z
draft: false
language: en
description: Ready to elevate your data game? Our team of experts is here to make data your secret weapon for success! Contact us now to begin your data-driven adventure!
---

<!-- @format -->

<section class="lg:pb-24">
  <div class="max-w-screen-md px-4 mx-auto">
      <p class="mb-8 font-light text-center text-gray-500 lg:mb-16 dark:text-gray-400 sm:text-xl">Ready to turn data into a driving force for success? Looking for an effortless solution to your technical hurdles? It's time to experience business value like never before - contact us now to get started!</p>
      <form name="contact" netlify class="space-y-8"
  method="POST"
  netlify-honeypot="bot-field"
  data-netlify="true" netlify>
    <p class="hidden">
    <label>
      Don’t fill this out if you’re human: <input name="bot-field" />
    </label>
  </p>
          <div class="my-4">
              <label for="email" class="block mb-2 font-medium text-gray-900 text-md dark:text-gray-300"><strong>Your Email:</strong>
              <input type="email" name = "email" id="email" class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 dark:shadow-sm-light" placeholder="name@example.com" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"></label>
          </div>
		  <div class="my-4">
                    <label for="service" class="block mb-2 font-medium text-gray-900 text-md dark:text-gray-300">Service</label>
      <select name="services" id="service" class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 dark:shadow-sm-light" >
        <option value="data-strategy">Data Strategy</option>
        <option value="web">Web</option>
        <option value="marketing">Marketing</option>
        <option value="general">General Inquiry</option>
      </select>
          </div>
		  <div class="my-4">
                    <label for="size" class="block mb-2 font-medium text-gray-900 text-md dark:text-gray-300">Category</label>
      <select name="size" id="size" class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 dark:shadow-sm-light" >
        <option value="other">Other</option>
		<option value="entry">Entry</option>
        <option value="scale">Scale</option>
        <option value="enterprise">Enterprise</option>
		</select>
          </div>
          <div class="my-4">
              <label for="subject" class="block mb-2 font-medium text-gray-900 text-md dark:text-gray-300"><strong>Subject:</strong></label>
              <input type="text" name = "subject" id="subject" class="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm text-md bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 dark:shadow-sm-light" placeholder="What are you looking for your business to succeed?" required>
          </div>
          <div class="my-4 sm:col-span-2">
              <label for="message" class="block mb-2 font-medium text-gray-900 text-md dark:text-gray-400"><strong>Your message:</strong></label>
              <textarea id="message" name = "message" rows="6" class="block p-2.5 w-full text-md text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500" placeholder="Your voice matters, and we can't wait to hear from you!"></textarea>
          </div>
          <div class="mt-6 lg:pb-16">
             <button type="submit" class="px-5 py-3 font-bold text-center text-white bg-indigo-600 rounded-lg text-md sm:w-fit hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800">Send Message</button>
          </div>
      </form>
  </div>
</section>
