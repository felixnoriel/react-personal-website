import { motion } from 'framer-motion'
import { useState } from 'react'

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission - open mail client
    const mailtoLink = `mailto:norielfelixjr@gmail.com?subject=Message from ${formData.name}&body=${encodeURIComponent(formData.message)}%0A%0AFrom: ${formData.email}`
    window.location.href = mailtoLink
  }

  const contactMethods = [
    {
      title: 'Email Me',
      value: 'norielfelixjr@gmail.com',
      emoji: '📧',
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Location',
      value: 'Sydney, Australia',
      subtitle: 'Open to remote work 🌍',
      emoji: '📍',
      color: 'from-pink-500 to-rose-600',
    },
    {
      title: 'Coffee Chat',
      value: "Let's grab a virtual coffee!",
      subtitle: 'Always up for a good conversation ☕',
      emoji: '☕',
      color: 'from-orange-500 to-amber-600',
    },
  ]

  return (
    <section id="contact-section" className="py-20 bg-gradient-to-br from-violet-50/50 via-white to-pink-50/50 relative overflow-hidden scroll-mt-28">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 rounded-2xl blur-xl opacity-50"
              />
              <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-comments text-white text-2xl" />
              </div>
            </div>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-primary">
            Let's Create Something Amazing!
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got a project in mind? Want to collaborate? Or just want to say hi? I'd love to hear from you! 🚀
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-8 border-2 border-violet-100 hover:border-violet-200 transition-all bg-white/80 backdrop-blur rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-paper-plane text-white" />
                </div>
                <h3 className="text-xl font-bold">Send Me a Message</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-violet-400 focus:outline-none transition-colors"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-violet-400 focus:outline-none transition-colors"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Tell me about your project or just say hi! 👋"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-violet-400 focus:outline-none transition-colors resize-none"
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="submit"
                    className="w-full py-3  font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    <i className="fas fa-paper-plane group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send Message
                    <i className="fas fa-sparkles" />
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                <div className="p-6 border-2 border-transparent hover:border-violet-200 transition-all bg-white/80 backdrop-blur rounded-xl hover:shadow-xl">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5,
                        }}
                        className={`absolute inset-0 bg-gradient-to-br ${method.color} rounded-xl blur-lg`}
                      />
                      <div className="relative w-12 h-12 bg-gradient-to-br from-white to-gray-50 rounded-xl flex items-center justify-center border-2 border-violet-200 shadow-lg text-xl">
                        {method.emoji}
                      </div>
                    </motion.div>
                    <div className="flex-grow">
                      <h4 className="font-bold mb-1">{method.title}</h4>
                      <p className="text-muted-foreground mb-1">{method.value}</p>
                      {method.subtitle && <p className="text-sm text-muted-foreground">{method.subtitle}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

          </motion.div>
        </div>
      </div>
    </section>
  )
}
